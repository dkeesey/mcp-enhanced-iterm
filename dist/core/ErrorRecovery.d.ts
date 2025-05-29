import { SessionManager } from '../session/SessionManager.js';
import { CommandExecutor } from './CommandExecutor.js';
import { ProcessTracker } from './ProcessTracker.js';
export interface ErrorContext {
    sessionId: string;
    errorType: 'timeout' | 'crash' | 'network' | 'command_failed' | 'session_lost';
    errorMessage: string;
    timestamp: Date;
    retryCount: number;
    recoverable: boolean;
}
export interface RecoveryStrategy {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
    timeoutMs: number;
    healthCheckInterval: number;
}
export interface SessionHealth {
    sessionId: string;
    isHealthy: boolean;
    lastCheck: Date;
    consecutiveFailures: number;
    errors: ErrorContext[];
}
export declare class ErrorRecovery {
    private sessionManager;
    private commandExecutor;
    private processTracker;
    private sessionHealth;
    private strategy;
    private healthCheckTimer?;
    constructor(sessionManager: SessionManager, commandExecutor: CommandExecutor, processTracker: ProcessTracker, strategy?: Partial<RecoveryStrategy>);
    /**
     * Start monitoring session health
     */
    startHealthMonitoring(): void;
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring(): void;
    /**
     * Perform health check on all sessions
     */
    private performHealthCheck;
    /**
     * Check health of a specific session
     */
    checkSessionHealth(sessionId: string): Promise<boolean>;
    /**
     * Update session health status
     */
    private updateSessionHealth;
    /**
     * Handle error with recovery attempt
     */
    handleError(context: ErrorContext): Promise<boolean>;
    /**
     * Recover from timeout error
     */
    private recoverFromTimeout;
    /**
     * Recover from crash
     */
    private recoverFromCrash;
    /**
     * Recover from network error
     */
    private recoverFromNetworkError;
    /**
     * Recover from command failure
     */
    private recoverFromCommandFailure;
    /**
     * Recover from session loss
     */
    private recoverFromSessionLoss;
    /**
     * Record error for tracking
     */
    private recordError;
    /**
     * Get session health status
     */
    getSessionHealth(sessionId: string): SessionHealth | undefined;
    /**
     * Get all unhealthy sessions
     */
    getUnhealthySessions(): SessionHealth[];
    /**
     * Create error context
     */
    createErrorContext(sessionId: string, errorType: ErrorContext['errorType'], errorMessage: string, recoverable?: boolean): ErrorContext;
    /**
     * Execute with retry
     */
    executeWithRetry<T>(sessionId: string, operation: () => Promise<T>, errorType?: ErrorContext['errorType']): Promise<T>;
    /**
     * Calculate retry delay with exponential backoff
     */
    private calculateRetryDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
    /**
     * Execute operation with timeout
     */
    private withTimeout;
}
//# sourceMappingURL=ErrorRecovery.d.ts.map