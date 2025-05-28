import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * AppleScript Utilities for Enhanced iTerm MCP
 * 
 * This module provides safe AppleScript execution with proper quote escaping
 * to prevent syntax errors when strings contain quotes or special characters.
 */
export class AppleScriptUtils {
  
  /**
   * Escapes a string for safe use in AppleScript
   * Uses proper AppleScript string literal escaping
   */
  static escapeString(str: string): string {
    // AppleScript uses backslash for escaping quotes and backslashes
    return str
      .replace(/\\/g, '\\\\')    // Escape backslashes first
      .replace(/"/g, '\\"');     // Escape double quotes
  }

  /**
   * Safely execute AppleScript using temporary file approach
   * This is the most reliable method for complex multi-line scripts
   */
  static async executeScript(script: string): Promise<string> {
    try {
      const tempScriptPath = `/tmp/applescript-${Date.now()}.scpt`;
      const fs = await import('fs/promises');
      
      // Write script to temporary file - this avoids all shell escaping issues
      await fs.writeFile(tempScriptPath, script, 'utf8');
      
      const { stdout } = await execAsync(`osascript "${tempScriptPath}"`);
      
      // Clean up temp file
      await fs.unlink(tempScriptPath).catch(() => {}); // Ignore cleanup errors
      
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript execution failed: ${error}`);
    }
  }

  /**
   * Execute simple single-line AppleScript using -e flag
   * Use this for simple scripts that don't have complex quoting
   */
  static async executeSimpleScript(script: string): Promise<string> {
    try {
      // For simple scripts, use -e flag with proper shell escaping
      const { stdout } = await execAsync(`osascript -e ${JSON.stringify(script)}`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript execution failed: ${error}`);
    }
  }

  /**
   * Execute multi-line AppleScript using multiple -e flags
   * Each line becomes a separate -e argument
   */
  static async executeMultiLineScript(lines: string[]): Promise<string> {
    try {
      const args = lines
        .filter(line => line.trim().length > 0)
        .map(line => `-e ${JSON.stringify(line.trim())}`)
        .join(' ');
      
      const { stdout } = await execAsync(`osascript ${args}`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript execution failed: ${error}`);
    }
  }

  /**
   * Safely execute AppleScript with variable substitution
   * Variables are properly escaped before substitution
   */
  static async executeScriptWithVariables(
    scriptTemplate: string, 
    variables: Record<string, string>
  ): Promise<string> {
    let script = scriptTemplate;
    
    // Replace variables with escaped values
    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = this.escapeString(value);
      script = script.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), escapedValue);
    }
    
    return this.executeScript(script);
  }

  /**
   * Get iTerm2 session variables safely
   */
  static async getSessionVariable(sessionId: string, variableName: string): Promise<string | null> {
    const script = `
tell application "iTerm2"
  repeat with aWindow in windows
    repeat with aTab in tabs of aWindow
      tell current session of aTab
        try
          if (variable named "user.session_id") is "${this.escapeString(sessionId)}" then
            return variable named "${this.escapeString(variableName)}"
          end if
        end try
      end tell
    end repeat
  end repeat
  return "not found"
end tell
    `;
    
    try {
      const result = await this.executeScript(script);
      return result === "not found" ? null : result;
    } catch (error) {
      console.error(`Failed to get session variable ${variableName}:`, error);
      return null;
    }
  }

  /**
   * Set iTerm2 session variable safely
   */
  static async setSessionVariable(
    sessionId: string, 
    variableName: string, 
    value: string
  ): Promise<boolean> {
    const script = `
tell application "iTerm2"
  repeat with aWindow in windows
    repeat with aTab in tabs of aWindow
      tell current session of aTab
        try
          if (variable named "user.session_id") is "${this.escapeString(sessionId)}" then
            set variable named "${this.escapeString(variableName)}" to "${this.escapeString(value)}"
            return "success"
          end if
        end try
      end tell
    end repeat
  end repeat
  return "not found"
end tell
    `;
    
    try {
      const result = await this.executeScript(script);
      return result === "success";
    } catch (error) {
      console.error(`Failed to set session variable ${variableName}:`, error);
      return false;
    }
  }
}