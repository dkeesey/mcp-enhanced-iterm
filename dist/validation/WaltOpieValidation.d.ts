import { SessionManager } from '../session/SessionManager.js';
import { TaskDistributor } from '../core/TaskDistributor.js';
import { ProgressAggregator } from '../core/ProgressAggregator.js';
import { SafetyTiers } from '../core/SafetyTiers.js';
import { PerformanceMonitor } from '../core/PerformanceMonitor.js';
import { ErrorRecovery } from '../core/ErrorRecovery.js';
export interface ValidationResult {
    testId: string;
    timestamp: Date;
    success: boolean;
    tasksCompleted: number;
    totalTasks: number;
    executionTime: number;
    sessionsUsed: string[];
    errors: string[];
    performanceMetrics: {
        avgCpuUsage: number;
        avgMemoryUsage: number;
        avgResponseTime: number;
    };
}
export declare class WaltOpieValidation {
    private sessionManager;
    private taskDistributor;
    private progressAggregator;
    private safetyTiers;
    private performanceMonitor;
    private errorRecovery;
    constructor(sessionManager: SessionManager, taskDistributor: TaskDistributor, progressAggregator: ProgressAggregator, safetyTiers: SafetyTiers, performanceMonitor: PerformanceMonitor, errorRecovery: ErrorRecovery);
    /**
     * Run comprehensive validation test simulating Walt Opie project analysis
     */
    runValidationTest(): Promise<ValidationResult>;
    /**
     * Create sessions for different analysis aspects
     */
    private createAnalysisSessions;
    /**
     * Configure safety tiers for analysis sessions
     */
    private configureSafetyTiers;
    /**
     * Create analysis prompts for Walt Opie project simulation
     */
    private createAnalysisPrompts;
    /**
     * Distribute analysis tasks across sessions
     */
    private distributeAnalysisTasks;
    /**
     * Monitor execution progress
     */
    private monitorExecution;
    /**
     * Aggregate and synthesize results
     */
    private aggregateResults;
    /**
     * Generate performance report for validation
     */
    private generatePerformanceReport;
    /**
     * Cleanup test sessions
     */
    private cleanupSessions;
    /**
     * Run quick validation test (simplified version)
     */
    runQuickValidationTest(): Promise<ValidationResult>;
}
//# sourceMappingURL=WaltOpieValidation.d.ts.map