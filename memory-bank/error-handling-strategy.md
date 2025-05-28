# Error Handling and Recovery Strategy

## Overview
This document outlines comprehensive error handling and recovery strategies for the enhanced iTerm MCP server, ensuring robustness and reliability in multi-session environments.

## Error Categories

### 1. AppleScript Errors
Common AppleScript errors and their handling strategies.

```typescript
enum AppleScriptError {
  ITERM_NOT_RUNNING = 'ITERM_NOT_RUNNING',
  TAB_NOT_FOUND = 'TAB_NOT_FOUND',
  WINDOW_NOT_FOUND = 'WINDOW_NOT_FOUND',
  SCRIPT_TIMEOUT = 'SCRIPT_TIMEOUT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_SYNTAX = 'INVALID_SYNTAX'
}

class AppleScriptErrorHandler {
  async handleError(error: Error, context: ErrorContext): Promise<ErrorRecovery> {
    const errorType = this.classifyError(error);
    
    switch (errorType) {
      case AppleScriptError.ITERM_NOT_RUNNING:
        return this.handleITermNotRunning();
        
      case AppleScriptError.TAB_NOT_FOUND:
        return this.handleTabNotFound(context);
        
      case AppleScriptError.SCRIPT_TIMEOUT:
        return this.handleScriptTimeout(context);
        
      default:
        return this.handleGenericError(error);
    }
  }
  
  private async handleITermNotRunning(): Promise<ErrorRecovery> {
    // Attempt to launch iTerm
    try {
      await this.launchITerm();
      return {
        recovered: true,
        action: 'LAUNCHED_ITERM',
        retry: true
      };
    } catch (launchError) {
      return {
        recovered: false,
        action: 'LAUNCH_FAILED',
        error: 'Unable to launch iTerm2. Please start it manually.'
      };
    }
  }
  
  private async handleTabNotFound(context: ErrorContext): Promise<ErrorRecovery> {
    // Try to recover session
    const session = await this.findOrphanedSession(context.sessionId);
    
    if (session) {
      return {
        recovered: true,
        action: 'SESSION_RECOVERED',
        data: session,
        retry: true
      };
    }
    
    // Create replacement session
    if (context.allowRecreation) {
      const newSession = await this.createReplacementSession(context);
      return {
        recovered: true,
        action: 'SESSION_RECREATED',
        data: newSession,
        retry: false
      };
    }
    
    return {
      recovered: false,
      action: 'SESSION_LOST',
      error: 'Session no longer exists and cannot be recovered'
    };
  }
}
```

### 2. Session State Errors
Errors related to session lifecycle and state management.

```typescript
class SessionStateError extends Error {
  constructor(
    public sessionId: string,
    public expectedState: SessionState,
    public actualState: SessionState,
    message: string
  ) {
    super(message);
  }
}

class SessionStateValidator {
  validateTransition(
    session: Session,
    targetState: SessionState
  ): ValidationResult {
    const validTransitions: Record<SessionState, SessionState[]> = {
      'initializing': ['ready', 'error'],
      'ready': ['busy', 'closing', 'error'],
      'busy': ['ready', 'waiting', 'error'],
      'waiting': ['ready', 'busy', 'error'],
      'error': ['ready', 'closing'],
      'closing': []
    };
    
    const allowedTransitions = validTransitions[session.state];
    
    if (!allowedTransitions.includes(targetState)) {
      return {
        valid: false,
        error: `Invalid state transition from ${session.state} to ${targetState}`
      };
    }
    
    return { valid: true };
  }
}
```

### 3. Command Execution Errors
Handling errors during command execution in terminal sessions.

```typescript
interface CommandExecutionError {
  type: 'TIMEOUT' | 'PERMISSION' | 'NOT_FOUND' | 'SYNTAX' | 'RUNTIME';
  command: string;
  sessionId: string;
  output?: string;
  exitCode?: number;
}

class CommandExecutionHandler {
  async executeWithRetry(
    command: string,
    session: Session,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || 30000;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout wrapper
        const result = await this.withTimeout(
          this.executeCommand(command, session),
          timeout
        );
        
        // Check for non-zero exit codes
        if (result.exitCode !== 0 && !options.allowNonZeroExit) {
          throw new CommandExecutionError({
            type: 'RUNTIME',
            command,
            sessionId: session.id,
            output: result.output,
            exitCode: result.exitCode
          });
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Determine if retry is appropriate
        if (!this.shouldRetry(error, attempt, maxRetries)) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.delay(delay);
        
        // Attempt recovery before retry
        await this.attemptRecovery(error, session);
      }
    }
    
    throw lastError;
  }
  
  private shouldRetry(error: Error, attempt: number, maxRetries: number): boolean {
    // Don't retry on final attempt
    if (attempt >= maxRetries) return false;
    
    // Retry on timeout or temporary failures
    if (error instanceof TimeoutError) return true;
    if (error instanceof AppleScriptError && error.type === 'SCRIPT_TIMEOUT') return true;
    
    // Don't retry on permanent failures
    if (error instanceof CommandNotFoundError) return false;
    if (error instanceof PermissionError) return false;
    
    return true;
  }
}
```

### 4. Multi-Session Coordination Errors
Errors specific to managing multiple sessions and agent coordination.

```typescript
class CoordinationError extends Error {
  constructor(
    public type: 'DEADLOCK' | 'CONFLICT' | 'SYNC_FAILURE' | 'COMMUNICATION',
    public agents: string[],
    message: string
  ) {
    super(message);
  }
}

class CoordinationErrorHandler {
  async handleDeadlock(agents: AgentInstance[]): Promise<void> {
    // Detect circular dependencies
    const dependencies = this.analyzeDependencies(agents);
    const cycles = this.findCycles(dependencies);
    
    if (cycles.length > 0) {
      // Break deadlock by prioritizing agents
      const priorityOrder = this.prioritizeAgents(agents);
      
      // Force sequential execution
      for (const agent of priorityOrder) {
        await this.forceCompleteTask(agent);
      }
    }
  }
  
  async handleConflict(
    resource: string,
    agents: AgentInstance[]
  ): Promise<void> {
    // Implement resource locking
    const lock = await this.acquireLock(resource);
    
    try {
      // Grant access to highest priority agent
      const winner = this.selectWinner(agents);
      await this.grantAccess(winner, resource);
      
      // Queue others
      const losers = agents.filter(a => a.id !== winner.id);
      for (const agent of losers) {
        await this.queueForResource(agent, resource);
      }
    } finally {
      await lock.release();
    }
  }
}
```

## Recovery Strategies

### 1. Session Recovery
```typescript
class SessionRecoveryService {
  async recoverSession(sessionId: string): Promise<Session | null> {
    // Step 1: Try to find the tab in iTerm
    const orphanedTab = await this.findOrphanedTab(sessionId);
    
    if (orphanedTab) {
      // Reattach to existing tab
      return await this.reattachSession(orphanedTab, sessionId);
    }
    
    // Step 2: Check for session snapshot
    const snapshot = await this.loadSessionSnapshot(sessionId);
    
    if (snapshot) {
      // Recreate session from snapshot
      return await this.recreateFromSnapshot(snapshot);
    }
    
    // Step 3: Create new session with same ID
    const metadata = await this.getSessionMetadata(sessionId);
    
    if (metadata) {
      return await this.createReplacementSession(metadata);
    }
    
    return null;
  }
  
  private async reattachSession(
    tab: TabInfo,
    sessionId: string
  ): Promise<Session> {
    // Restore session context
    const context = await this.restoreContext(sessionId);
    
    // Rebuild session object
    const session: Session = {
      id: sessionId,
      windowId: tab.windowId,
      tabId: tab.tabId,
      state: 'ready',
      context,
      ...this.getSessionDefaults()
    };
    
    // Re-register session
    await this.sessionManager.registerSession(session);
    
    return session;
  }
}
```

### 2. State Synchronization Recovery
```typescript
class StateSyncRecovery {
  async recoverFromDesync(session: Session): Promise<void> {
    // Get actual state from iTerm
    const actualState = await this.getActualSessionState(session.tabId);
    
    // Compare with expected state
    const differences = this.compareStates(session.context, actualState);
    
    // Reconcile differences
    for (const diff of differences) {
      switch (diff.type) {
        case 'WORKING_DIRECTORY':
          await this.syncWorkingDirectory(session, actualState.cwd);
          break;
          
        case 'ENVIRONMENT':
          await this.syncEnvironment(session, actualState.env);
          break;
          
        case 'RUNNING_PROCESS':
          await this.syncProcessState(session, actualState.processes);
          break;
      }
    }
    
    // Update session context
    session.context = this.mergeContexts(session.context, actualState);
    session.lastSync = new Date();
  }
}
```

### 3. Transaction Rollback
```typescript
class TransactionManager {
  private transactions = new Map<string, Transaction>();
  
  async executeTransaction(
    sessionId: string,
    operations: Operation[]
  ): Promise<void> {
    const transaction = this.createTransaction(sessionId, operations);
    
    try {
      // Record initial state
      const snapshot = await this.createSnapshot(sessionId);
      transaction.snapshot = snapshot;
      
      // Execute operations
      for (const operation of operations) {
        await this.executeOperation(operation);
        transaction.completed.push(operation);
      }
      
      // Commit transaction
      await this.commit(transaction);
      
    } catch (error) {
      // Rollback on failure
      await this.rollback(transaction);
      throw error;
    }
  }
  
  private async rollback(transaction: Transaction): Promise<void> {
    // Restore from snapshot
    if (transaction.snapshot) {
      await this.restoreSnapshot(transaction.sessionId, transaction.snapshot);
    }
    
    // Undo completed operations in reverse order
    for (const operation of transaction.completed.reverse()) {
      if (operation.undo) {
        await this.executeOperation(operation.undo);
      }
    }
  }
}
```

## Error Monitoring and Alerting

### 1. Error Metrics Collection
```typescript
interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorRate: number;
  recoveryRate: number;
  avgRecoveryTime: number;
}

class ErrorMonitor {
  private metrics: ErrorMetrics = this.initializeMetrics();
  private errorLog: ErrorLogEntry[] = [];
  
  async logError(error: Error, context: ErrorContext): Promise<void> {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        type: this.classifyError(error)
      },
      context,
      sessionId: context.sessionId,
      agentId: context.agentId,
      recovered: false
    };
    
    this.errorLog.push(entry);
    this.updateMetrics(entry);
    
    // Alert if threshold exceeded
    if (this.shouldAlert(entry)) {
      await this.sendAlert(entry);
    }
  }
  
  private shouldAlert(entry: ErrorLogEntry): boolean {
    // Alert on critical errors
    if (entry.error.type === 'CRITICAL') return true;
    
    // Alert on high error rate
    if (this.metrics.errorRate > 0.1) return true;
    
    // Alert on repeated errors
    const recentSimilar = this.errorLog.filter(e => 
      e.error.type === entry.error.type &&
      e.timestamp > new Date(Date.now() - 300000) // 5 minutes
    );
    
    return recentSimilar.length > 5;
  }
}
```

### 2. Health Checks
```typescript
class HealthCheckService {
  async performHealthCheck(): Promise<HealthStatus> {
    const checks = [
      this.checkITermConnection(),
      this.checkSessionHealth(),
      this.checkMemoryUsage(),
      this.checkResponseTime()
    ];
    
    const results = await Promise.all(checks);
    
    return {
      healthy: results.every(r => r.passed),
      checks: results,
      timestamp: new Date()
    };
  }
  
  private async checkSessionHealth(): Promise<HealthCheckResult> {
    const sessions = await this.sessionManager.getAllSessions();
    const unhealthy = sessions.filter(s => s.state === 'error');
    
    return {
      name: 'session_health',
      passed: unhealthy.length === 0,
      details: {
        total: sessions.length,
        healthy: sessions.length - unhealthy.length,
        unhealthy: unhealthy.length
      }
    };
  }
}
```

## Best Practices

### 1. Defensive Programming
```typescript
// Always validate inputs
async function executeCommand(command: string, sessionId: string) {
  // Input validation
  if (!command || typeof command !== 'string') {
    throw new ValidationError('Command must be a non-empty string');
  }
  
  if (!sessionId || !isValidSessionId(sessionId)) {
    throw new ValidationError('Invalid session ID');
  }
  
  // Sanitize command
  const sanitized = sanitizeCommand(command);
  
  // Check session exists and is ready
  const session = await getSession(sessionId);
  if (!session) {
    throw new SessionNotFoundError(sessionId);
  }
  
  if (session.state !== 'ready') {
    throw new SessionNotReadyError(sessionId, session.state);
  }
  
  // Execute with timeout
  return await executeWithTimeout(sanitized, session, 30000);
}
```

### 2. Graceful Degradation
```typescript
class GracefulDegradation {
  async executeWithFallback(
    primary: () => Promise<any>,
    fallback: () => Promise<any>
  ): Promise<any> {
    try {
      return await primary();
    } catch (error) {
      console.warn('Primary operation failed, using fallback', error);
      return await fallback();
    }
  }
  
  // Example: Multi-session falling back to single session
  async createSession(options: SessionOptions): Promise<Session> {
    return await this.executeWithFallback(
      // Try multi-session approach
      () => this.createEnhancedSession(options),
      // Fall back to legacy single session
      () => this.createLegacySession(options)
    );
  }
}
```

### 3. Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailure?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldTryHalfOpen()) {
        this.state = 'half-open';
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

## Testing Error Scenarios

### 1. Error Injection
```typescript
class ErrorInjector {
  private enabled = false;
  private scenarios: ErrorScenario[] = [];
  
  inject(scenario: ErrorScenario): void {
    if (this.enabled && this.shouldInject(scenario)) {
      throw scenario.error;
    }
  }
  
  // Usage in code
  async executeCommand(command: string): Promise<void> {
    // Inject error for testing
    this.errorInjector.inject({
      type: 'COMMAND_EXECUTION',
      probability: 0.1,
      error: new CommandTimeoutError('Injected timeout')
    });
    
    // Normal execution
    return await this.doExecute(command);
  }
}
```

### 2. Chaos Testing
```typescript
class ChaosMonkey {
  async runChaosTest(duration: number): Promise<ChaosReport> {
    const endTime = Date.now() + duration;
    const events: ChaosEvent[] = [];
    
    while (Date.now() < endTime) {
      const action = this.selectRandomAction();
      
      try {
        await this.executeAction(action);
        events.push({ action, result: 'success' });
      } catch (error) {
        events.push({ action, result: 'failure', error });
      }
      
      await this.randomDelay();
    }
    
    return this.generateReport(events);
  }
  
  private selectRandomAction(): ChaosAction {
    const actions: ChaosAction[] = [
      { type: 'KILL_TAB', target: 'random' },
      { type: 'OVERFLOW_BUFFER', size: 'large' },
      { type: 'CORRUPT_MESSAGE', probability: 0.5 },
      { type: 'DELAY_RESPONSE', ms: 5000 },
      { type: 'EXHAUST_RESOURCES', resource: 'memory' }
    ];
    
    return actions[Math.floor(Math.random() * actions.length)];
  }
}
```

## Conclusion

This comprehensive error handling strategy ensures the enhanced iTerm MCP server can gracefully handle failures, recover from errors, and maintain reliability even in complex multi-session scenarios. The combination of proactive validation, intelligent recovery, and comprehensive monitoring creates a robust system capable of handling real-world usage patterns.