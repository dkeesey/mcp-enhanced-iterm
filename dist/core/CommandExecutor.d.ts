export declare class CommandExecutor {
    /**
     * Write text to the current session (backward compatible)
     */
    writeToTerminal(text: string): Promise<void>;
    /**
     * Write text to a specific session
     */
    writeToSession(sessionId: string, text: string): Promise<void>;
    /**
     * Read output from the current session (backward compatible)
     */
    readTerminalOutput(lines?: number): Promise<string>;
    /**
     * Read output from a specific session
     */
    readSessionOutput(sessionId: string, lines?: number): Promise<string>;
    /**
     * Send control character to current session (backward compatible)
     */
    sendControlCharacter(character: string): Promise<void>;
    /**
     * Send control character to specific session
     */
    sendControlToSession(sessionId: string, character: string): Promise<void>;
}
//# sourceMappingURL=CommandExecutor.d.ts.map