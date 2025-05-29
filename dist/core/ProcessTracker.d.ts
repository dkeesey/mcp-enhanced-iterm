export interface ProcessInfo {
    pid: number;
    ppid: number;
    command: string;
    cpu: number;
    memory: number;
}
export interface SessionState {
    sessionId: string;
    isProcessing: boolean;
    tty?: string;
    processes: ProcessInfo[];
    lastChecked: Date;
}
export declare class ProcessTracker {
    private sessionStates;
    /**
     * Monitor all sessions and return their current states
     */
    monitorAllSessions(): Promise<SessionState[]>;
    /**
     * Get processes for a specific TTY
     */
    private getProcessesForTty;
    /**
     * Parse AppleScript output to session states
     * FIXED: Properly handle comma-separated format from AppleScript
     */
    private parseSessionStates;
    private extractValue;
    /**
     * Get state changes since last check
     */
    getStateChanges(previousStates: SessionState[], currentStates: SessionState[]): string[];
    /**
     * Get a single session state
     */
    getSessionState(sessionId: string): SessionState | undefined;
    /**
     * Check if any session is busy
     */
    hasActiveSessions(): boolean;
}
//# sourceMappingURL=ProcessTracker.d.ts.map