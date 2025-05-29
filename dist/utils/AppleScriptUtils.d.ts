/**
 * AppleScript Utilities for Enhanced iTerm MCP
 *
 * This module provides safe AppleScript execution with proper quote escaping
 * to prevent syntax errors when strings contain quotes or special characters.
 */
export declare class AppleScriptUtils {
    /**
     * Escapes a string for safe use in AppleScript
     * Uses proper AppleScript string literal escaping
     */
    static escapeString(str: string): string;
    /**
     * Safely execute AppleScript using temporary file approach
     * This is the most reliable method for complex multi-line scripts
     */
    static executeScript(script: string): Promise<string>;
    /**
     * Execute simple single-line AppleScript using -e flag
     * Use this for simple scripts that don't have complex quoting
     */
    static executeSimpleScript(script: string): Promise<string>;
    /**
     * Execute multi-line AppleScript using multiple -e flags
     * Each line becomes a separate -e argument
     */
    static executeMultiLineScript(lines: string[]): Promise<string>;
    /**
     * Safely execute AppleScript with variable substitution
     * Variables are properly escaped before substitution
     */
    static executeScriptWithVariables(scriptTemplate: string, variables: Record<string, string>): Promise<string>;
    /**
     * Get iTerm2 session variables safely
     */
    static getSessionVariable(sessionId: string, variableName: string): Promise<string | null>;
    /**
     * Set iTerm2 session variable safely
     */
    static setSessionVariable(sessionId: string, variableName: string, value: string): Promise<boolean>;
}
//# sourceMappingURL=AppleScriptUtils.d.ts.map