import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class ProcessTracker {
    sessionStates = new Map();
    /**
     * Monitor all sessions and return their current states
     */
    async monitorAllSessions() {
        const script = `
      tell application "iTerm2"
        set sessionInfoList to {}
        
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              set sessionInfo to {}
              
              try
                set sessionId to variable named "user.session_id"
              on error
                set sessionId to missing value
              end try
              
              if sessionId is not missing value then
                set sessionInfo to sessionInfo & {sessionId:sessionId}
                set sessionInfo to sessionInfo & {tty:tty}
                set sessionInfo to sessionInfo & {isProcessing:is processing}
                set end of sessionInfoList to sessionInfo
              end if
            end tell
          end repeat
        end repeat
        
        return sessionInfoList
      end tell
    `;
        try {
            const { stdout } = await execAsync(`osascript -e '${script}'`);
            const sessions = this.parseSessionStates(stdout);
            // Update process info for each session
            const updatedSessions = await Promise.all(sessions.map(async (session) => {
                if (session.tty) {
                    const processes = await this.getProcessesForTty(session.tty);
                    session.processes = processes;
                }
                return session;
            }));
            // Update internal state
            updatedSessions.forEach(session => {
                this.sessionStates.set(session.sessionId, session);
            });
            return updatedSessions;
        }
        catch (error) {
            console.error('Error monitoring sessions:', error);
            return [];
        }
    }
    /**
     * Get processes for a specific TTY
     */
    async getProcessesForTty(tty) {
        try {
            // Get all processes for this TTY
            const { stdout } = await execAsync(`ps -o pid,ppid,command,%cpu,%mem -t ${tty} | tail -n +2`);
            const lines = stdout.trim().split('\n').filter(line => line.length > 0);
            return lines.map(line => {
                const parts = line.trim().split(/\s+/);
                return {
                    pid: parseInt(parts[0] || '0', 10),
                    ppid: parseInt(parts[1] || '0', 10),
                    command: parts.slice(2, -2).join(' '),
                    cpu: parseFloat(parts[parts.length - 2] || '0'),
                    memory: parseFloat(parts[parts.length - 1] || '0')
                };
            });
        }
        catch (error) {
            return [];
        }
    }
    /**
     * Parse AppleScript output to session states
     * FIXED: Properly handle comma-separated format from AppleScript
     */
    parseSessionStates(output) {
        const states = [];
        if (!output || !output.trim()) {
            return states;
        }
        // The output format is: "sessionId:value, tty:value, isProcessing:value"
        // Parse this directly since it's comma-separated key:value pairs
        const trimmedOutput = output.trim();
        const parts = trimmedOutput.split(',').map(p => p.trim());
        // Group every 3 parts into a session
        for (let i = 0; i < parts.length; i += 3) {
            const sessionIdPart = parts[i];
            const ttyPart = parts[i + 1];
            const isProcessingPart = parts[i + 2];
            if (sessionIdPart && ttyPart && isProcessingPart) {
                const sessionId = this.extractValue(sessionIdPart, 'sessionId');
                const tty = this.extractValue(ttyPart, 'tty');
                const isProcessing = this.extractValue(isProcessingPart, 'isProcessing') === 'true';
                if (sessionId && sessionId !== 'missing value') {
                    const sessionState = {
                        sessionId,
                        isProcessing,
                        tty: tty !== 'missing value' ? tty : undefined,
                        processes: [],
                        lastChecked: new Date()
                    };
                    states.push(sessionState);
                }
            }
        }
        return states;
    }
    extractValue(data, key) {
        const regex = new RegExp(`${key}:([^,}]+)`);
        const match = data.match(regex);
        return match ? match[1]?.trim() : undefined;
    }
    /**
     * Get state changes since last check
     */
    getStateChanges(previousStates, currentStates) {
        const changes = [];
        const prevMap = new Map(previousStates.map(s => [s.sessionId, s]));
        const currMap = new Map(currentStates.map(s => [s.sessionId, s]));
        // Check for state changes
        currentStates.forEach(current => {
            const previous = prevMap.get(current.sessionId);
            if (!previous) {
                changes.push(`Session ${current.sessionId}: New session detected`);
            }
            else {
                if (previous.isProcessing !== current.isProcessing) {
                    changes.push(`Session ${current.sessionId}: Processing state changed from ${previous.isProcessing} to ${current.isProcessing}`);
                }
                // Check for significant process changes
                const prevMainProcess = previous.processes[0];
                const currMainProcess = current.processes[0];
                if (prevMainProcess?.command !== currMainProcess?.command) {
                    changes.push(`Session ${current.sessionId}: Main process changed from "${prevMainProcess?.command || 'none'}" to "${currMainProcess?.command || 'none'}"`);
                }
            }
        });
        // Check for removed sessions
        previousStates.forEach(prev => {
            if (!currMap.has(prev.sessionId)) {
                changes.push(`Session ${prev.sessionId}: Session removed`);
            }
        });
        return changes;
    }
    /**
     * Get a single session state
     */
    getSessionState(sessionId) {
        return this.sessionStates.get(sessionId);
    }
    /**
     * Check if any session is busy
     */
    hasActiveSessions() {
        return Array.from(this.sessionStates.values()).some(state => state.isProcessing);
    }
}
//# sourceMappingURL=ProcessTracker.js.map