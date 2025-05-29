export interface TaskProgress {
    sessionId: string;
    taskId: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    output: string[];
    startTime: Date;
    endTime?: Date;
    error?: string;
}
export interface AggregatedProgress {
    id: string;
    mainTaskId: string;
    subtasks: Map<string, TaskProgress>;
    overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed' | 'partial';
    startTime: Date;
    endTime?: Date;
    summary?: string;
}
export declare class ProgressAggregator {
    private progressMap;
    /**
     * Create a new aggregated progress tracker
     */
    createAggregation(mainTaskId: string, sessionIds: string[]): string;
    /**
     * Update progress for a specific session
     */
    updateProgress(aggregationId: string, sessionId: string, update: Partial<TaskProgress>): void;
    /**
     * Add output from a session
     */
    addOutput(aggregationId: string, sessionId: string, output: string): void;
    /**
     * Get current aggregated progress
     */
    getProgress(aggregationId: string): AggregatedProgress | undefined;
    /**
     * Get all active aggregations
     */
    getAllAggregations(): AggregatedProgress[];
    /**
     * Synthesize results from all subtasks
     */
    synthesizeResults(aggregationId: string): string;
    /**
     * Detect if all subtasks are complete
     */
    isComplete(aggregationId: string): boolean;
    /**
     * Update overall status based on subtask statuses
     */
    private updateOverallStatus;
    /**
     * Generate intelligent summary of results
     */
    generateSummary(aggregationId: string): Promise<string>;
    /**
     * Create a basic summary without AI
     */
    private createBasicSummary;
    /**
     * Clean up completed aggregations
     */
    cleanup(olderThanMinutes?: number): number;
}
//# sourceMappingURL=ProgressAggregator.d.ts.map