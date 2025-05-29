export class ErrorRecovery {
    sessionManager;
    commandExecutor;
    processTracker;
    sessionHealth = new Map();
    strategy;
    healthCheckTimer;
    constructor(sessionManager, commandExecutor, processTracker, strategy) {
        this.sessionManager = sessionManager;
        this.commandExecutor = commandExecutor;
        this.processTracker = processTracker;
        this.strategy = {
            maxRetries: 3,
            retryDelay: 1000,
            backoffMultiplier: 2,
            timeoutMs: 30000,
            healthCheckInterval: 10000,
            ...strategy
        };
    }
    /**
     * Start monitoring session health
     */
    startHealthMonitoring() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        this.healthCheckTimer = setInterval(async () => {
            await this.performHealthCheck();
        }, this.strategy.healthCheckInterval);
    }
    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }
    /**
     * Perform health check on all sessions
     */
    async performHealthCheck() {
        const sessions = await this.sessionManager.enumerateSessions();
        for (const session of sessions) {
            const health = await this.checkSessionHealth(session.id);
            this.updateSessionHealth(session.id, health);
        }
    }
    /**
     * Check health of a specific session
     */
    async checkSessionHealth(sessionId) {
        try {
            // Try to read output from the session
            await this.commandExecutor.readSessionOutput(sessionId, 1);
            // Check if session is still in the process list
            const states = await this.processTracker.monitorAllSessions();
            const sessionState = states.find(s => s.sessionId === sessionId);
            return !!sessionState;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Update session health status
     */
    updateSessionHealth(sessionId, isHealthy) {
        const health = this.sessionHealth.get(sessionId) || {
            sessionId,
            isHealthy: true,
            lastCheck: new Date(),
            consecutiveFailures: 0,
            errors: []
        };
        health.lastCheck = new Date();
        health.isHealthy = isHealthy;
        if (!isHealthy) {
            health.consecutiveFailures++;
            health.errors.push({
                sessionId,
                errorType: 'session_lost',
                errorMessage: 'Health check failed',
                timestamp: new Date(),
                retryCount: 0,
                recoverable: true
            });
        }
        else {
            health.consecutiveFailures = 0;
        }
        this.sessionHealth.set(sessionId, health);
    }
    /**
     * Handle error with recovery attempt
     */
    async handleError(context) {
        // Record the error
        this.recordError(context);
        // Check if we should attempt recovery
        if (!context.recoverable || context.retryCount >= this.strategy.maxRetries) {
            return false;
        }
        // Attempt recovery based on error type
        switch (context.errorType) {
            case 'timeout':
                return await this.recoverFromTimeout(context);
            case 'crash':
                return await this.recoverFromCrash(context);
            case 'network':
                return await this.recoverFromNetworkError(context);
            case 'command_failed':
                return await this.recoverFromCommandFailure(context);
            case 'session_lost':
                return await this.recoverFromSessionLoss(context);
            default:
                return false;
        }
    }
    /**
     * Recover from timeout error
     */
    async recoverFromTimeout(context) {
        const delay = this.calculateRetryDelay(context.retryCount);
        await this.sleep(delay);
        try {
            // Send interrupt to the session
            await this.commandExecutor.sendControlToSession(context.sessionId, 'c');
            await this.sleep(500);
            // Check if session is responsive
            const isHealthy = await this.checkSessionHealth(context.sessionId);
            return isHealthy;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Recover from crash
     */
    async recoverFromCrash(context) {
        try {
            // Check if session still exists
            const sessions = await this.sessionManager.enumerateSessions();
            const sessionExists = sessions.some(s => s.id === context.sessionId);
            if (!sessionExists) {
                // Session is gone, we might need to create a new one
                // This would be handled by the caller
                return false;
            }
            // Try to restart the command in the session
            await this.commandExecutor.sendControlToSession(context.sessionId, 'c');
            await this.sleep(1000);
            return await this.checkSessionHealth(context.sessionId);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Recover from network error
     */
    async recoverFromNetworkError(context) {
        const delay = this.calculateRetryDelay(context.retryCount);
        await this.sleep(delay);
        // Network errors usually resolve themselves, just retry
        return await this.checkSessionHealth(context.sessionId);
    }
    /**
     * Recover from command failure
     */
    async recoverFromCommandFailure(context) {
        try {
            // Clear the command line
            await this.commandExecutor.sendControlToSession(context.sessionId, 'c');
            await this.sleep(500);
            // Try to reset to a clean state
            await this.commandExecutor.writeToSession(context.sessionId, 'clear\n');
            await this.sleep(500);
            return await this.checkSessionHealth(context.sessionId);
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Recover from session loss
     */
    async recoverFromSessionLoss(context) {
        try {
            // Session is completely lost, we can't recover it
            // Mark it as unhealthy and let the caller handle recreation
            this.updateSessionHealth(context.sessionId, false);
            return false;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Record error for tracking
     */
    recordError(context) {
        const health = this.sessionHealth.get(context.sessionId) || {
            sessionId: context.sessionId,
            isHealthy: true,
            lastCheck: new Date(),
            consecutiveFailures: 0,
            errors: []
        };
        health.errors.push(context);
        // Keep only last 100 errors
        if (health.errors.length > 100) {
            health.errors = health.errors.slice(-100);
        }
        this.sessionHealth.set(context.sessionId, health);
    }
    /**
     * Get session health status
     */
    getSessionHealth(sessionId) {
        return this.sessionHealth.get(sessionId);
    }
    /**
     * Get all unhealthy sessions
     */
    getUnhealthySessions() {
        return Array.from(this.sessionHealth.values())
            .filter(health => !health.isHealthy || health.consecutiveFailures > 0);
    }
    /**
     * Create error context
     */
    createErrorContext(sessionId, errorType, errorMessage, recoverable = true) {
        return {
            sessionId,
            errorType,
            errorMessage,
            timestamp: new Date(),
            retryCount: 0,
            recoverable
        };
    }
    /**
     * Execute with retry
     */
    async executeWithRetry(sessionId, operation, errorType = 'command_failed') {
        let lastError;
        let retryCount = 0;
        while (retryCount <= this.strategy.maxRetries) {
            try {
                return await this.withTimeout(operation(), this.strategy.timeoutMs);
            }
            catch (error) {
                lastError = error;
                const context = this.createErrorContext(sessionId, error instanceof TimeoutError ? 'timeout' : errorType, lastError.message);
                context.retryCount = retryCount;
                const recovered = await this.handleError(context);
                if (!recovered && retryCount < this.strategy.maxRetries) {
                    retryCount++;
                    const delay = this.calculateRetryDelay(retryCount);
                    await this.sleep(delay);
                }
                else if (!recovered) {
                    break;
                }
            }
        }
        throw lastError || new Error('Operation failed after retries');
    }
    /**
     * Calculate retry delay with exponential backoff
     */
    calculateRetryDelay(retryCount) {
        return this.strategy.retryDelay * Math.pow(this.strategy.backoffMultiplier, retryCount);
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Execute operation with timeout
     */
    async withTimeout(promise, timeoutMs) {
        const timeout = new Promise((_, reject) => {
            setTimeout(() => reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        return Promise.race([promise, timeout]);
    }
}
class TimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TimeoutError';
    }
}
//# sourceMappingURL=ErrorRecovery.js.map