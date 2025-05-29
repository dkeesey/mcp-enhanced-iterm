import { AppleScriptUtils } from '../utils/AppleScriptUtils.js';
export class CommandExecutor {
    /**
     * Write text to the current session (backward compatible)
     */
    async writeToTerminal(text) {
        console.error('[CommandExecutor] writeToTerminal called with:', typeof text, 'value:', text);
        // Validate parameter
        if (text === undefined || text === null) {
            console.error('[CommandExecutor] ERROR: text parameter is undefined or null in writeToTerminal');
            throw new Error('Text parameter cannot be undefined or null');
        }
        const script = `tell application "iTerm2" to tell current session of current window to write text "\${text}"`;
        console.error('[CommandExecutor] Executing AppleScript:', script);
        await AppleScriptUtils.executeScriptWithVariables(script, { text });
    }
    /**
     * Write text to a specific session
     */
    async writeToSession(sessionId, text) {
        console.error('[CommandExecutor] writeToSession called with sessionId:', sessionId, 'text:', typeof text, 'value:', text);
        // Validate parameters
        if (!sessionId) {
            throw new Error('Session ID cannot be empty');
        }
        if (text === undefined || text === null) {
            console.error('[CommandExecutor] ERROR: text parameter is undefined or null in writeToSession');
            throw new Error('Text parameter cannot be undefined or null');
        }
        const script = `
      tell application "iTerm2"
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              try
                if (variable named "user.session_id") is "\${sessionId}" then
                  write text "\${text}"
                  return "written"
                end if
              end try
            end tell
          end repeat
        end repeat
        return "not found"
      end tell
    `;
        const result = await AppleScriptUtils.executeScriptWithVariables(script, { sessionId, text });
        if (result.trim() === 'not found') {
            throw new Error(`Session ${sessionId} not found`);
        }
    }
    /**
     * Read output from the current session (backward compatible)
     */
    async readTerminalOutput(lines = 50) {
        const script = `
      tell application "iTerm2"
        tell front window
          tell current session of current tab
            set numRows to number of rows
            set allContent to contents
            return allContent
          end tell
        end tell
      end tell
    `;
        const result = await AppleScriptUtils.executeScript(script);
        const allLines = result.split('\n');
        // Return last N lines
        return allLines.slice(-lines).join('\n');
    }
    /**
     * Read output from a specific session
     */
    async readSessionOutput(sessionId, lines = 50) {
        const script = `
      tell application "iTerm2"
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              try
                if (variable named "user.session_id") is "\${sessionId}" then
                  set allContent to contents
                  return allContent
                end if
              end try
            end tell
          end repeat
        end repeat
        return "SESSION_NOT_FOUND"
      end tell
    `;
        const result = await AppleScriptUtils.executeScriptWithVariables(script, { sessionId });
        if (result.trim() === 'SESSION_NOT_FOUND') {
            throw new Error(`Session ${sessionId} not found`);
        }
        const allLines = result.split('\n');
        return allLines.slice(-lines).join('\n');
    }
    /**
     * Send control character to current session (backward compatible)
     */
    async sendControlCharacter(character) {
        const charMap = {
            'c': 3, // Ctrl-C
            'd': 4, // Ctrl-D
            'z': 26, // Ctrl-Z
            'l': 12, // Ctrl-L
            ']': 29, // Ctrl-] (telnet escape)
            'ESC': 27, // Escape
        };
        const asciiCode = charMap[character];
        if (!asciiCode) {
            throw new Error(`Unknown control character: ${character}`);
        }
        const script = `
      tell application "iTerm2"
        tell front window
          tell current session of current tab
            write text (ASCII character ${asciiCode})
          end tell
        end tell
      end tell
    `;
        await AppleScriptUtils.executeScript(script);
    }
    /**
     * Send control character to specific session
     */
    async sendControlToSession(sessionId, character) {
        const charMap = {
            'c': 3, // Ctrl-C
            'd': 4, // Ctrl-D
            'z': 26, // Ctrl-Z
            'l': 12, // Ctrl-L
            ']': 29, // Ctrl-] (telnet escape)
            'ESC': 27, // Escape
        };
        const asciiCode = charMap[character];
        if (!asciiCode) {
            throw new Error(`Unknown control character: ${character}`);
        }
        const script = `
      tell application "iTerm2"
        repeat with aWindow in windows
          repeat with aTab in tabs of aWindow
            tell current session of aTab
              try
                if (variable named "user.session_id") is "\${sessionId}" then
                  write text (ASCII character ${asciiCode})
                  return "sent"
                end if
              end try
            end tell
          end repeat
        end repeat
        return "not found"
      end tell
    `;
        const result = await AppleScriptUtils.executeScriptWithVariables(script, { sessionId });
        if (result.trim() === 'not found') {
            throw new Error(`Session ${sessionId} not found`);
        }
    }
}
//# sourceMappingURL=CommandExecutor.js.map