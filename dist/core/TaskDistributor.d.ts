import { SessionManager } from '../session/SessionManager.js';
import { ClaudeCodeIntegration } from './ClaudeCodeIntegration.js';
export interface DistributedTask {
    id: string;
    mainPrompt: string;
    subtasks: Subtask[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    results?: Map<string, string>;
}
export interface Subtask {
    id: string;
    sessionId?: string;
    prompt: string;
    dependencies: string[];
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
    result?: string;
    error?: string;
}
export interface TaskDistributionStrategy {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryAttempts: number;
}
export declare class TaskDistributor {
    private sessionManager;
    private claudeIntegration;
    private activeTasks;
    constructor(sessionManager: SessionManager, claudeIntegration: ClaudeCodeIntegration, _strategy?: Partial<TaskDistributionStrategy>);
    /**
     * Distribute a complex task across multiple sessions
     */
    distributeTask(mainPrompt: string, subtaskPrompts: string[]): Promise<DistributedTask>;
    /**
     * Execute the task distribution
     */
    private executeDistribution;
    /**
     * Assign subtasks to available sessions
     */
    private assignSubtasksToSessions;
    /**
     * Create an intelligent task breakdown using Claude
     */
    createIntelligentTaskBreakdown(complexPrompt: string): Promise<string[]>;
    /**
     * Execute subtasks in their assigned sessions
     */
    private executeSubtasks;
    createTaskBreakdown(complexPrompt: string): Promise<string[]>;
    /**
     * Get status of active distributed tasks
     */
    getActiveTasks(): DistributedTask[];
    /**
     * Get a specific task by ID
     */
    getTask(taskId: string): DistributedTask | undefined;
    /**
     * Cancel a distributed task
     */
    cancelTask(taskId: string): Promise<void>;
}
//# sourceMappingURL=TaskDistributor.d.ts.map