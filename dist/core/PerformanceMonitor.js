export class PerformanceMonitor {
    processTracker;
    sessionManager;
    metricsHistory = new Map();
    systemMetricsHistory = [];
    alerts = [];
    commandCounts = new Map();
    errorCounts = new Map();
    lastCommandTime = new Map();
    monitoringTimer;
    thresholds;
    constructor(processTracker, sessionManager, thresholds) {
        this.processTracker = processTracker;
        this.sessionManager = sessionManager;
        this.thresholds = {
            maxCpuPerSession: 80,
            maxMemoryPerSession: 1024, // MB
            maxResponseTime: 5000, // ms
            maxErrorRate: 0.1, // 10%
            maxTotalCpu: 90,
            maxTotalMemory: 8192, // MB
            ...thresholds
        };
    }
    /**
     * Start performance monitoring
     */
    startMonitoring(intervalMs = 5000) {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        this.monitoringTimer = setInterval(async () => {
            await this.collectMetrics();
        }, intervalMs);
        // Collect initial metrics
        this.collectMetrics();
    }
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = undefined;
        }
    }
    /**
     * Collect metrics for all sessions
     */
    async collectMetrics() {
        const sessionStates = await this.processTracker.monitorAllSessions();
        const sessions = await this.sessionManager.enumerateSessions();
        const timestamp = new Date();
        let totalCpu = 0;
        let totalMemory = 0;
        let totalResponseTime = 0;
        let activeSessionCount = 0;
        // Collect per-session metrics
        for (const session of sessions) {
            const state = sessionStates.find(s => s.sessionId === session.id);
            if (!state)
                continue;
            const metrics = this.calculateSessionMetrics(session.id, state, timestamp);
            this.recordSessionMetrics(session.id, metrics);
            // Check thresholds and create alerts
            this.checkSessionThresholds(metrics);
            // Aggregate for system metrics
            if (state.isProcessing) {
                activeSessionCount++;
                totalResponseTime += metrics.responseTime;
            }
            totalCpu += metrics.cpuUsage;
            totalMemory += metrics.memoryUsage;
        }
        // Calculate system metrics
        const systemMetrics = {
            timestamp,
            totalSessions: sessions.length,
            activeSessions: activeSessionCount,
            totalCpuUsage: totalCpu,
            totalMemoryUsage: totalMemory,
            averageResponseTime: activeSessionCount > 0 ? totalResponseTime / activeSessionCount : 0,
            commandsPerSecond: this.calculateCommandsPerSecond(),
            errorRate: this.calculateErrorRate()
        };
        this.recordSystemMetrics(systemMetrics);
        this.checkSystemThresholds(systemMetrics);
    }
    /**
     * Calculate metrics for a session
     */
    calculateSessionMetrics(sessionId, state, timestamp) {
        const cpuUsage = state.processes.reduce((sum, p) => sum + p.cpu, 0);
        const memoryUsage = state.processes.reduce((sum, p) => sum + p.memory, 0);
        // Calculate response time
        const lastCommand = this.lastCommandTime.get(sessionId);
        const responseTime = lastCommand
            ? timestamp.getTime() - lastCommand.getTime()
            : 0;
        return {
            timestamp,
            sessionId,
            cpuUsage,
            memoryUsage,
            responseTime,
            commandCount: this.commandCounts.get(sessionId) || 0,
            errorCount: this.errorCounts.get(sessionId) || 0,
            isHealthy: cpuUsage < this.thresholds.maxCpuPerSession &&
                memoryUsage < this.thresholds.maxMemoryPerSession
        };
    }
    /**
     * Record session metrics
     */
    recordSessionMetrics(sessionId, metrics) {
        const history = this.metricsHistory.get(sessionId) || [];
        history.push(metrics);
        // Keep only last hour of metrics (assuming 5s intervals = 720 entries)
        if (history.length > 720) {
            history.shift();
        }
        this.metricsHistory.set(sessionId, history);
    }
    /**
     * Record system metrics
     */
    recordSystemMetrics(metrics) {
        this.systemMetricsHistory.push(metrics);
        // Keep only last hour
        if (this.systemMetricsHistory.length > 720) {
            this.systemMetricsHistory.shift();
        }
    }
    /**
     * Check session thresholds and create alerts
     */
    checkSessionThresholds(metrics) {
        if (metrics.cpuUsage > this.thresholds.maxCpuPerSession) {
            this.createAlert('high', 'cpu', `Session ${metrics.sessionId} CPU usage exceeds threshold`, metrics.sessionId, metrics.cpuUsage, this.thresholds.maxCpuPerSession);
        }
        if (metrics.memoryUsage > this.thresholds.maxMemoryPerSession) {
            this.createAlert('high', 'memory', `Session ${metrics.sessionId} memory usage exceeds threshold`, metrics.sessionId, metrics.memoryUsage, this.thresholds.maxMemoryPerSession);
        }
        if (metrics.responseTime > this.thresholds.maxResponseTime) {
            this.createAlert('medium', 'response_time', `Session ${metrics.sessionId} response time exceeds threshold`, metrics.sessionId, metrics.responseTime, this.thresholds.maxResponseTime);
        }
    }
    /**
     * Check system thresholds
     */
    checkSystemThresholds(metrics) {
        if (metrics.totalCpuUsage > this.thresholds.maxTotalCpu) {
            this.createAlert('critical', 'system', 'Total system CPU usage exceeds threshold', undefined, metrics.totalCpuUsage, this.thresholds.maxTotalCpu);
        }
        if (metrics.totalMemoryUsage > this.thresholds.maxTotalMemory) {
            this.createAlert('critical', 'system', 'Total system memory usage exceeds threshold', undefined, metrics.totalMemoryUsage, this.thresholds.maxTotalMemory);
        }
        if (metrics.errorRate > this.thresholds.maxErrorRate) {
            this.createAlert('high', 'error_rate', 'System error rate exceeds threshold', undefined, metrics.errorRate, this.thresholds.maxErrorRate);
        }
    }
    /**
     * Create performance alert
     */
    createAlert(severity, type, message, sessionId, value, threshold) {
        const alert = {
            id: `alert-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            timestamp: new Date(),
            severity,
            type,
            message,
            sessionId,
            value,
            threshold
        };
        this.alerts.push(alert);
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts.shift();
        }
    }
    /**
     * Calculate commands per second
     */
    calculateCommandsPerSecond() {
        const totalCommands = Array.from(this.commandCounts.values())
            .reduce((sum, count) => sum + count, 0);
        // Assuming we're calculating over the last minute
        return totalCommands / 60;
    }
    /**
     * Calculate error rate
     */
    calculateErrorRate() {
        const totalCommands = Array.from(this.commandCounts.values())
            .reduce((sum, count) => sum + count, 0);
        const totalErrors = Array.from(this.errorCounts.values())
            .reduce((sum, count) => sum + count, 0);
        return totalCommands > 0 ? totalErrors / totalCommands : 0;
    }
    /**
     * Record command execution
     */
    recordCommand(sessionId) {
        this.commandCounts.set(sessionId, (this.commandCounts.get(sessionId) || 0) + 1);
        this.lastCommandTime.set(sessionId, new Date());
    }
    /**
     * Record error
     */
    recordError(sessionId) {
        this.errorCounts.set(sessionId, (this.errorCounts.get(sessionId) || 0) + 1);
    }
    /**
     * Get current metrics for a session
     */
    getSessionMetrics(sessionId) {
        const history = this.metricsHistory.get(sessionId);
        return history?.[history.length - 1];
    }
    /**
     * Get metrics history for a session
     */
    getSessionMetricsHistory(sessionId, limit) {
        const history = this.metricsHistory.get(sessionId) || [];
        return limit ? history.slice(-limit) : history;
    }
    /**
     * Get current system metrics
     */
    getSystemMetrics() {
        return this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
    }
    /**
     * Get system metrics history
     */
    getSystemMetricsHistory(limit) {
        return limit ? this.systemMetricsHistory.slice(-limit) : this.systemMetricsHistory;
    }
    /**
     * Get recent alerts
     */
    getAlerts(severity, limit = 100) {
        let alerts = this.alerts;
        if (severity) {
            alerts = alerts.filter(a => a.severity === severity);
        }
        return alerts.slice(-limit);
    }
    /**
     * Get performance report
     */
    getPerformanceReport() {
        const system = this.getSystemMetrics();
        const sessions = new Map();
        // Get latest metrics for each session
        for (const [sessionId] of this.metricsHistory) {
            sessions.set(sessionId, this.getSessionMetrics(sessionId));
        }
        // Count health status
        let healthy = 0;
        let unhealthy = 0;
        let critical = 0;
        for (const metrics of sessions.values()) {
            if (!metrics)
                continue;
            if (metrics.isHealthy) {
                healthy++;
            }
            else if (metrics.cpuUsage > 90 || metrics.memoryUsage > 2048) {
                critical++;
            }
            else {
                unhealthy++;
            }
        }
        return {
            system,
            sessions,
            recentAlerts: this.getAlerts(undefined, 10),
            health: { healthy, unhealthy, critical }
        };
    }
    /**
     * Optimize performance by suggesting actions
     */
    getOptimizationSuggestions() {
        const suggestions = [];
        const system = this.getSystemMetrics();
        if (!system)
            return suggestions;
        // Check if too many sessions
        if (system.totalSessions > 10 && system.totalCpuUsage > 70) {
            suggestions.push('Consider reducing the number of concurrent sessions to improve CPU usage');
        }
        // Check memory usage
        if (system.totalMemoryUsage > this.thresholds.maxTotalMemory * 0.8) {
            suggestions.push('Memory usage is approaching threshold. Consider closing idle sessions');
        }
        // Check error rate
        if (system.errorRate > 0.05) {
            suggestions.push('High error rate detected. Review recent command failures');
        }
        // Check response times
        if (system.averageResponseTime > 3000) {
            suggestions.push('Response times are slow. Consider optimizing command execution');
        }
        return suggestions;
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map