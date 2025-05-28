# Enhanced iTerm MCP API Reference

## Overview

The Enhanced iTerm MCP provides comprehensive monitoring and management capabilities through a Model Context Protocol interface. This document details all available monitoring functions, their parameters, and usage patterns.

## Core API Categories

### 1. Session Management APIs

#### `session_create`
Creates a new iTerm2 session with optional configuration.

**Parameters:**
- `name` (string, optional): Session identifier
- `command` (string, optional): Initial command to execute
- `workingDirectory` (string, optional): Starting directory path

**Returns:**
```typescript
{
  sessionId: string;
  name: string;
  status: 'active' | 'idle';
  createdAt: string;
}
```

**Example:**
```json
{
  "tool": "session_create",
  "name": "build-worker-1",
  "command": "npm run build",
  "workingDirectory": "/projects/app"
}
```

#### `session_list`
Retrieves all active sessions with their current status.

**Parameters:** None

**Returns:**
```typescript
{
  sessions: Array<{
    sessionId: string;
    name: string;
    status: 'active' | 'idle' | 'error';
    cpu: number;
    memory: number;
    lastActivity: string;
  }>;
  total: number;
}
```

#### `session_close`
Terminates a specific session.

**Parameters:**
- `sessionId` (string, required): Target session ID

**Returns:**
```typescript
{
  success: boolean;
  sessionId: string;
  closedAt: string;
}
```

### 2. Performance Monitoring APIs

#### `performance_monitor`
Real-time performance metrics for all sessions.

**Parameters:**
- `interval` (number, optional): Monitoring interval in ms (default: 5000)
- `metrics` (string[], optional): Specific metrics to track

**Available Metrics:**
- `cpu`: CPU usage percentage
- `memory`: Memory usage in MB
- `network`: Network I/O statistics
- `disk`: Disk I/O statistics
- `response_time`: Command response latency

**Returns:**
```typescript
{
  timestamp: string;
  overall: {
    cpu: number;
    memory: number;
    activeSessions: number;
  };
  sessions: Array<{
    sessionId: string;
    metrics: {
      cpu: number;
      memory: number;
      responseTime: number;
      [key: string]: number;
    };
  }>;
}
```

#### `performance_history`
Historical performance data with aggregation options.

**Parameters:**
- `duration` (string, required): Time range (e.g., "1h", "24h", "7d")
- `resolution` (string, optional): Data point interval
- `sessionId` (string, optional): Filter by session

**Returns:**
```typescript
{
  dataPoints: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    sessions: number;
  }>;
  summary: {
    avgCpu: number;
    maxCpu: number;
    avgMemory: number;
    maxMemory: number;
  };
}
```

### 3. Task Distribution APIs

#### `task_distribute`
Distributes tasks across multiple Claude instances.

**Parameters:**
- `tasks` (Array<Task>, required): Task definitions
- `strategy` (string, optional): Distribution strategy
- `maxConcurrent` (number, optional): Concurrent execution limit

**Task Structure:**
```typescript
interface Task {
  id: string;
  type: 'command' | 'script' | 'analysis';
  payload: any;
  priority: 'high' | 'medium' | 'low';
  timeout?: number;
  dependencies?: string[];
}
```

**Distribution Strategies:**
- `round-robin`: Even distribution
- `load-balanced`: Based on current load
- `priority`: High priority first
- `dependency`: Respects task dependencies

**Returns:**
```typescript
{
  distributed: Array<{
    taskId: string;
    sessionId: string;
    status: 'queued' | 'running' | 'completed';
  }>;
  queueLength: number;
  estimatedCompletion: string;
}
```

#### `task_status`
Monitors distributed task execution.

**Parameters:**
- `taskIds` (string[], optional): Specific tasks to monitor
- `sessionId` (string, optional): Filter by session

**Returns:**
```typescript
{
  tasks: Array<{
    id: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    sessionId: string;
    progress: number;
    result?: any;
    error?: string;
    startedAt?: string;
    completedAt?: string;
  }>;
}
```

### 4. Health Monitoring APIs

#### `health_check`
Comprehensive system health assessment.

**Parameters:**
- `detailed` (boolean, optional): Include detailed diagnostics

**Returns:**
```typescript
{
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  components: {
    sessions: {
      status: string;
      active: number;
      max: number;
    };
    performance: {
      status: string;
      cpu: number;
      memory: number;
    };
    connectivity: {
      status: string;
      latency: number;
    };
  };
  issues?: Array<{
    component: string;
    severity: 'warning' | 'error';
    message: string;
  }>;
}
```

#### `health_history`
Historical health data for trend analysis.

**Parameters:**
- `duration` (string, required): Time range
- `includeIncidents` (boolean, optional): Include past incidents

**Returns:**
```typescript
{
  uptime: number;
  incidents: Array<{
    timestamp: string;
    severity: string;
    duration: number;
    resolved: boolean;
    cause: string;
  }>;
  availability: number;
}
```

### 5. Error Recovery APIs

#### `error_recover`
Automatic error recovery with configurable strategies.

**Parameters:**
- `sessionId` (string, required): Affected session
- `strategy` (string, optional): Recovery strategy
- `maxRetries` (number, optional): Retry limit

**Recovery Strategies:**
- `restart`: Restart the session
- `reset`: Reset to clean state
- `failover`: Switch to backup session
- `graceful`: Graceful degradation

**Returns:**
```typescript
{
  recovered: boolean;
  sessionId: string;
  newSessionId?: string;
  strategy: string;
  attempts: number;
}
```

### 6. Progress Aggregation APIs

#### `progress_aggregate`
Aggregates progress from multiple sessions.

**Parameters:**
- `pattern` (string, optional): Progress marker pattern
- `format` (string, optional): Output format

**Returns:**
```typescript
{
  overall: {
    completed: number;
    total: number;
    percentage: number;
  };
  bySession: Array<{
    sessionId: string;
    completed: number;
    total: number;
    lastUpdate: string;
  }>;
  timeline: Array<{
    timestamp: string;
    progress: number;
  }>;
}
```

### 7. Safety Control APIs

#### `safety_approve`
Manages command approval based on safety tiers.

**Parameters:**
- `command` (string, required): Command to evaluate
- `sessionId` (string, required): Target session
- `override` (boolean, optional): Force approval

**Returns:**
```typescript
{
  approved: boolean;
  tier: 'safe' | 'review' | 'dangerous';
  reason?: string;
  requiresConfirmation: boolean;
}
```

## WebSocket Streaming APIs

For real-time monitoring, Enhanced iTerm MCP supports WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3456/monitor');

ws.on('open', () => {
  ws.send(JSON.stringify({
    subscribe: ['performance', 'health', 'progress'],
    interval: 1000
  }));
});
```

### Event Types

#### `performance.update`
```typescript
{
  type: 'performance.update';
  data: PerformanceMetrics;
}
```

#### `health.alert`
```typescript
{
  type: 'health.alert';
  data: {
    severity: 'warning' | 'error' | 'critical';
    component: string;
    message: string;
  };
}
```

#### `progress.update`
```typescript
{
  type: 'progress.update';
  data: {
    sessionId: string;
    progress: number;
    milestone?: string;
  };
}
```

## Rate Limiting

All APIs implement rate limiting to prevent resource exhaustion:

- **Default Limits:**
  - 100 requests per minute per endpoint
  - 1000 requests per hour total
  - Burst allowance: 20 requests

- **Headers:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Error Codes

Standard error responses follow this format:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Common Error Codes

- `SESSION_NOT_FOUND`: Invalid session ID
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_PARAMETERS`: Malformed request
- `PERMISSION_DENIED`: Insufficient privileges
- `RESOURCE_EXHAUSTED`: System limit reached
- `INTERNAL_ERROR`: Server-side error

## Best Practices

1. **Connection Management**
   - Reuse session IDs when possible
   - Implement exponential backoff for retries
   - Close sessions explicitly when done

2. **Performance Optimization**
   - Batch operations when possible
   - Use streaming APIs for real-time data
   - Cache frequently accessed data

3. **Error Handling**
   - Always check response status
   - Implement proper error recovery
   - Log errors for debugging

4. **Security**
   - Validate all input parameters
   - Use appropriate safety tiers
   - Monitor for suspicious activity

## Version History

- **v3.0.0**: Enterprise monitoring features
- **v2.5.0**: WebSocket streaming support
- **v2.0.0**: Task distribution APIs
- **v1.0.0**: Initial release