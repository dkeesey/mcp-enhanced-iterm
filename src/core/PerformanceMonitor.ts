import { ProcessTracker, SessionState } from './ProcessTracker.js';
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

export class PerformanceMonitor {
  private processTracker: ProcessTracker;
  private sessionManager: SessionManager;
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private systemMetricsHistory: SystemMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private commandCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private lastCommandTime: Map<string, Date> = new Map();
  private monitoringTimer?: NodeJS.Timeout;
  private thresholds: PerformanceThresholds;
  
  constructor(
    processTracker: ProcessTracker,
    sessionManager: SessionManager,
    thresholds?: Partial<PerformanceThresholds>
  ) {
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
  startMonitoring(intervalMs: number = 5000): void {
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
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }
  
  /**
   * Collect metrics for all sessions
   */
  private async collectMetrics(): Promise<void> {
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
      if (!state) continue;
      
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
    const systemMetrics: SystemMetrics = {
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
  private calculateSessionMetrics(
    sessionId: string,
    state: SessionState,
    timestamp: Date
  ): PerformanceMetrics {
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
  private recordSessionMetrics(sessionId: string, metrics: PerformanceMetrics): void {
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
  private recordSystemMetrics(metrics: SystemMetrics): void {
    this.systemMetricsHistory.push(metrics);
    
    // Keep only last hour
    if (this.systemMetricsHistory.length > 720) {
      this.systemMetricsHistory.shift();
    }
  }
  
  /**
   * Check session thresholds and create alerts
   */
  private checkSessionThresholds(metrics: PerformanceMetrics): void {
    if (metrics.cpuUsage > this.thresholds.maxCpuPerSession) {
      this.createAlert(
        'high',
        'cpu',
        `Session ${metrics.sessionId} CPU usage exceeds threshold`,
        metrics.sessionId,
        metrics.cpuUsage,
        this.thresholds.maxCpuPerSession
      );
    }
    
    if (metrics.memoryUsage > this.thresholds.maxMemoryPerSession) {
      this.createAlert(
        'high',
        'memory',
        `Session ${metrics.sessionId} memory usage exceeds threshold`,
        metrics.sessionId,
        metrics.memoryUsage,
        this.thresholds.maxMemoryPerSession
      );
    }
    
    if (metrics.responseTime > this.thresholds.maxResponseTime) {
      this.createAlert(
        'medium',
        'response_time',
        `Session ${metrics.sessionId} response time exceeds threshold`,
        metrics.sessionId,
        metrics.responseTime,
        this.thresholds.maxResponseTime
      );
    }
  }
  
  /**
   * Check system thresholds
   */
  private checkSystemThresholds(metrics: SystemMetrics): void {
    if (metrics.totalCpuUsage > this.thresholds.maxTotalCpu) {
      this.createAlert(
        'critical',
        'system',
        'Total system CPU usage exceeds threshold',
        undefined,
        metrics.totalCpuUsage,
        this.thresholds.maxTotalCpu
      );
    }
    
    if (metrics.totalMemoryUsage > this.thresholds.maxTotalMemory) {
      this.createAlert(
        'critical',
        'system',
        'Total system memory usage exceeds threshold',
        undefined,
        metrics.totalMemoryUsage,
        this.thresholds.maxTotalMemory
      );
    }
    
    if (metrics.errorRate > this.thresholds.maxErrorRate) {
      this.createAlert(
        'high',
        'error_rate',
        'System error rate exceeds threshold',
        undefined,
        metrics.errorRate,
        this.thresholds.maxErrorRate
      );
    }
  }
  
  /**
   * Create performance alert
   */
  private createAlert(
    severity: PerformanceAlert['severity'],
    type: PerformanceAlert['type'],
    message: string,
    sessionId: string | undefined,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
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
  private calculateCommandsPerSecond(): number {
    const totalCommands = Array.from(this.commandCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    // Assuming we're calculating over the last minute
    return totalCommands / 60;
  }
  
  /**
   * Calculate error rate
   */
  private calculateErrorRate(): number {
    const totalCommands = Array.from(this.commandCounts.values())
      .reduce((sum, count) => sum + count, 0);
    const totalErrors = Array.from(this.errorCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    return totalCommands > 0 ? totalErrors / totalCommands : 0;
  }
  
  /**
   * Record command execution
   */
  recordCommand(sessionId: string): void {
    this.commandCounts.set(sessionId, (this.commandCounts.get(sessionId) || 0) + 1);
    this.lastCommandTime.set(sessionId, new Date());
  }
  
  /**
   * Record error
   */
  recordError(sessionId: string): void {
    this.errorCounts.set(sessionId, (this.errorCounts.get(sessionId) || 0) + 1);
  }
  
  /**
   * Get current metrics for a session
   */
  getSessionMetrics(sessionId: string): PerformanceMetrics | undefined {
    const history = this.metricsHistory.get(sessionId);
    return history?.[history.length - 1];
  }
  
  /**
   * Get metrics history for a session
   */
  getSessionMetricsHistory(sessionId: string, limit?: number): PerformanceMetrics[] {
    const history = this.metricsHistory.get(sessionId) || [];
    return limit ? history.slice(-limit) : history;
  }
  
  /**
   * Get current system metrics
   */
  getSystemMetrics(): SystemMetrics | undefined {
    return this.systemMetricsHistory[this.systemMetricsHistory.length - 1];
  }
  
  /**
   * Get system metrics history
   */
  getSystemMetricsHistory(limit?: number): SystemMetrics[] {
    return limit ? this.systemMetricsHistory.slice(-limit) : this.systemMetricsHistory;
  }
  
  /**
   * Get recent alerts
   */
  getAlerts(severity?: PerformanceAlert['severity'], limit: number = 100): PerformanceAlert[] {
    let alerts = this.alerts;
    
    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }
    
    return alerts.slice(-limit);
  }
  
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
  } {
    const system = this.getSystemMetrics();
    const sessions = new Map<string, PerformanceMetrics | undefined>();
    
    // Get latest metrics for each session
    for (const [sessionId] of this.metricsHistory) {
      sessions.set(sessionId, this.getSessionMetrics(sessionId));
    }
    
    // Count health status
    let healthy = 0;
    let unhealthy = 0;
    let critical = 0;
    
    for (const metrics of sessions.values()) {
      if (!metrics) continue;
      
      if (metrics.isHealthy) {
        healthy++;
      } else if (metrics.cpuUsage > 90 || metrics.memoryUsage > 2048) {
        critical++;
      } else {
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
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const system = this.getSystemMetrics();
    
    if (!system) return suggestions;
    
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