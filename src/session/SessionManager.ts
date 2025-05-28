import { Session, SessionContext } from '../types/index.js';
import { AppleScriptUtils } from '../utils/AppleScriptUtils.js';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private nextSessionNumber = 1;

  async enumerateSessions(): Promise<Session[]> {
    const script = `
      tell application "iTerm2"
        set sessionList to {}
        set windowIndex to 1
        
        repeat with aWindow in windows
          set tabIndex to 1
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              set sessionInfo to {windowId:windowIndex, tabId:tabIndex}
              
              try
                set sessionId to variable named "user.session_id"
                set sessionInfo to sessionInfo & {sessionId:sessionId}
              on error
                set sessionInfo to sessionInfo & {sessionId:missing value}
              end try
              
              try
                set sessionName to variable named "user.session_name"
                set sessionInfo to sessionInfo & {sessionName:sessionName}
              on error
                set sessionInfo to sessionInfo & {sessionName:missing value}
              end try
              
              try
                set workingDir to variable named "user.path"
                set sessionInfo to sessionInfo & {workingDir:workingDir}
              on error
                set sessionInfo to sessionInfo & {workingDir:missing value}
              end try
              
              set sessionInfo to sessionInfo & {tty:tty}
              set sessionInfo to sessionInfo & {isProcessing:is processing}
              
              set end of sessionList to sessionInfo
            end tell
            set tabIndex to tabIndex + 1
          end repeat
          set windowIndex to windowIndex + 1
        end repeat
        
        return sessionList
      end tell
    `;

    try {
      const result = await AppleScriptUtils.executeScript(script);
      return this.parseSessionList(result);
    } catch (error) {
      console.error('Error enumerating sessions:', error);
      return [];
    }
  }

  private parseSessionList(output: string): Session[] {
    const sessions: Session[] = [];
    
    // The output is a comma-separated list of properties for multiple sessions
    // Example: "windowId:1, tabId:1, sessionId:missing value, ..., windowId:1, tabId:2, ..."
    
    // Split by windowId to separate sessions (each session starts with windowId)
    const sessionChunks = output.split(/(?=windowId:)/);
    
    for (const chunk of sessionChunks) {
      if (!chunk.trim()) continue;
      const session = this.parseSessionData(chunk.trim());
      if (session) {
        sessions.push(session);
        if (session.id) {
          this.sessions.set(session.id, session);
        }
      }
    }
    
    return sessions;
  }

  private parseSessionData(data: string): Session | null {
    const windowId = this.extractValue(data, 'windowId');
    const tabId = this.extractValue(data, 'tabId');
    const sessionId = this.extractValue(data, 'sessionId');
    const sessionName = this.extractValue(data, 'sessionName');
    const workingDir = this.extractValue(data, 'workingDir');
    const isProcessing = this.extractValue(data, 'isProcessing') === 'true';
    
    if (!windowId || !tabId) return null;
    
    // Generate ID if not set
    const id = sessionId || `session-${windowId}-${tabId}`;
    const name = sessionName || `Window ${windowId} Tab ${tabId}`;
    
    const context: SessionContext = {
      workingDirectory: workingDir || '~',
      environment: {},
      history: [],
      variables: {}
    };
    
    return {
      id,
      windowId,
      tabId,
      name,
      state: isProcessing ? 'busy' : 'idle',
      context,
      created: new Date(),
      lastActive: new Date()
    };
  }

  private extractValue(data: string, key: string): string | undefined {
    const regex = new RegExp(`${key}:([^,]+)`);
    const match = data.match(regex);
    const value = match ? match[1]?.trim() : undefined;
    return value === 'missing value' ? undefined : value;
  }

  async createSession(name?: string, profile: string = 'Default'): Promise<Session> {
    const sessionId = `enhanced-session-${this.nextSessionNumber++}`;
    const sessionName = name || `Session ${this.nextSessionNumber}`;
    
    // Fixed AppleScript with proper window reference and safe variable handling
    const script = `
      tell application "iTerm2"
        tell current window
          set currentWindowId to id
          set newTab to (create tab with profile "${AppleScriptUtils.escapeString(profile)}")
          tell current session of newTab
            set variable named "user.session_id" to "${AppleScriptUtils.escapeString(sessionId)}"
            set variable named "user.session_name" to "${AppleScriptUtils.escapeString(sessionName)}"
          end tell
          return {windowId:currentWindowId, tabId:"created"}
        end tell
      end tell
    `;
    
    try {
      const result = await AppleScriptUtils.executeScript(script);
      
      // Parse the result to extract windowId and tabId
      const windowId = this.extractValue(result, 'windowId') || '1';
      const tabId = this.extractValue(result, 'tabId') || '1';
      
      // Create session object
      const session: Session = {
        id: sessionId,
        windowId,
        tabId,
        name: sessionName,
        state: 'idle',
        context: {
          workingDirectory: '~',
          environment: {},
          history: [],
          variables: {}
        },
        created: new Date(),
        lastActive: new Date()
      };
      
      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      throw new Error(`Failed to create session: ${error}`);
    }
  }

  async switchToSession(sessionId: string): Promise<void> {
    const script = `
      tell application "iTerm2"
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              try
                if (variable named "user.session_id") is "${AppleScriptUtils.escapeString(sessionId)}" then
                  select aTab
                  tell aWindow to select
                  return "switched"
                end if
              end try
            end tell
          end repeat
        end repeat
        return "not found"
      end tell
    `;
    
    const result = await AppleScriptUtils.executeScript(script);
    if (result.trim() === 'not found') {
      throw new Error(`Session ${sessionId} not found`);
    }
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  updateSessionState(sessionId: string, state: Session['state']): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = state;
      session.lastActive = new Date();
    }
  }

  async setSessionWorkingDirectory(sessionId: string, directory: string): Promise<void> {
    const script = `
      tell application "iTerm2"
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              try
                if (variable named "user.session_id") is "${AppleScriptUtils.escapeString(sessionId)}" then
                  write text "cd ${AppleScriptUtils.escapeString(directory)}"
                  set variable named "user.path" to "${AppleScriptUtils.escapeString(directory)}"
                  return "changed"
                end if
              end try
            end tell
          end repeat
        end repeat
        return "not found"
      end tell
    `;
    
    const result = await AppleScriptUtils.executeScript(script);
    if (result.trim() === 'not found') {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Update internal state
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context.workingDirectory = directory;
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const script = `
      tell application "iTerm2"
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              try
                if (variable named "user.session_id") is "${AppleScriptUtils.escapeString(sessionId)}" then
                  close
                  return "closed"
                end if
              end try
            end tell
          end repeat
        end repeat
        return "not found"
      end tell
    `;
    
    const result = await AppleScriptUtils.executeScript(script);
    if (result.trim() === 'not found') {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    // Remove from internal state
    this.sessions.delete(sessionId);
  }

  async closeAllSessions(): Promise<void> {
    const sessionIds = Array.from(this.sessions.keys());
    await Promise.all(sessionIds.map(id => this.closeSession(id).catch(() => {})));
    this.sessions.clear();
  }
}