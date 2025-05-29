import { ProcessTracker } from './ProcessTracker.js';
import { SessionManager } from '../session/SessionManager.js';
export interface PerformanceMetrics {
    timestamp: Date;
    sessionId: string;
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
    commandCount: number;
    errorCount: number;
    isHealthy: boolean;
}
export interface SystemMetrics {
    timestamp: Date;
    totalSessions: number;
    activeSessions: number;
    totalCpuUsage: number;
    totalMemoryUsage: number;
    averageResponseTime: number;
    commandsPerSecond: number;
    errorRate: number;
}
export interface PerformanceThresholds {
    maxCpuPerSession: number;
    maxMemoryPerSession: number;
    maxResponseTime: number;
    maxErrorRate: number;
    maxTotalCpu: number;
    maxTotalMemory: number;
}
export interface PerformanceAlert {
    id: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: 'cpu' | 'memory' | 'response_time' | 'error_rate' | 'system';
    message: string;
    sessionId?: string;
    value: number;
    threshold: number;
}
export declare class PerformanceMonitor {
    private processTracker;
    private sessionManager;
    private metricsHistory;
    private systemMetricsHistory;
    private alerts;
    private commandCounts;
    private errorCounts;
    private lastCommandTime;
    private monitoringTimer?;
    private thresholds;
    constructor(processTracker: ProcessTracker, sessionManager: SessionManager, thresholds?: Partial<PerformanceThresholds>);
    /**
     * Start performance monitoring
     */
    startMonitoring(intervalMs?: number): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Collect metrics for all sessions
     */
    private collectMetrics;
    /**
     * Calculate metrics for a session
     */
    private calculateSessionMetrics;
    /**
     * Record session metrics
     */
    private recordSessionMetrics;
    /**
     * Record system metrics
     */
    private recordSystemMetrics;
    /**
     * Check session thresholds and create alerts
     */
    private checkSessionThresholds;
    /**
     * Check system thresholds
     */
    private checkSystemThresholds;
    /**
     * Create performance alert
     */
    private createAlert;
    /**
     * Calculate commands per second
     */
    private calculateCommandsPerSecond;
    /**
     * Calculate error rate
     */
    private calculateErrorRate;
    /**
     * Record command execution
     */
    recordCommand(sessionId: string): void;
    /**
     * Record error
     */
    recordError(sessionId: string): void;
    /**
     * Get current metrics for a session
     */
    getSessionMetrics(sessionId: string): PerformanceMetrics | undefined;
    /**
     * Get metrics history for a session
     */
    getSessionMetricsHistory(sessionId: string, limit?: number): PerformanceMetrics[];
    /**
     * Get current system metrics
     */
    getSystemMetrics(): SystemMetrics | undefined;
    /**
     * Get system metrics history
     */
    getSystemMetricsHistory(limit?: number): SystemMetrics[];
    /**
     * Get recent alerts
     */
    getAlerts(severity?: PerformanceAlert['severity'], limit?: number): PerformanceAlert[];
    /**
     * Get performance report
     */
    getPerformanceReport(): {
        system: SystemMetrics | undefined;
        sessions: Map<string, PerformanceMetrics | undefined>;
        recentAlerts: PerformanceAlert[];
        health: {
            healthy: number;
            unhealthy: number;
            critical: number;
        };
    };
    /**
     * Optimize performance by suggesting actions
     */
    getOptimizationSuggestions(): string[];
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map