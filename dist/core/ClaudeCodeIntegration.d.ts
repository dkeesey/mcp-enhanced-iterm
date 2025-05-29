import { CommandExecutor } from './CommandExecutor.js';
export interface ClaudePromptResult {
    sessionId: string;
    prompt: string;
    response?: string;
    status: 'pending' | 'completed' | 'error';
    error?: string;
    startTime: Date;
    endTime?: Date;
}
export declare class ClaudeCodeIntegration {
    private commandExecutor;
    private activePrompts;
    constructor(commandExecutor: CommandExecutor);
    /**
     * Send a prompt to Claude Code in a specific session
     */
    promptClaudeCode(sessionId: string, prompt: string): Promise<string>;
    /**
     * Wait for Claude Code response
     */
    private waitForResponse;
    /**
     * Extract Claude's response from terminal output
     */
    private extractClaudeResponse;
    /**
     * Send a prompt to multiple sessions
     */
    promptMultipleSessions(sessionIds: string[], prompt: string): Promise<Map<string, string>>;
    /**
     * Get status of active prompts
     */
    getActivePrompts(): ClaudePromptResult[];
    /**
     * Get prompt history
     */
    getPromptHistory(): ClaudePromptResult[];
    private sleep;
}
//# sourceMappingURL=ClaudeCodeIntegration.d.ts.map