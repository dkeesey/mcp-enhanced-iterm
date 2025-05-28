# Multi-Session Management Architecture

## Overview
This document details the architecture for extending iTerm MCP with multi-session management capabilities, enabling concurrent terminal sessions and Claude Code orchestration.

## Core Architecture Components

### 1. Session Manager
The central component responsible for creating, tracking, and managing multiple iTerm sessions.

```typescript
class SessionManager {
  private sessions: Map<string, Session>;
  private activeSessionId: string | null;
  
  async createSession(options: SessionOptions): Promise<Session> {
    // Create new iTerm tab/window via AppleScript
    // Initialize session context
    // Register in session map
    // Return session handle
  }
  
  async switchSession(sessionId: string): Promise<void> {
    // Validate session exists
    // Execute AppleScript to focus tab
    // Update active session
    // Restore session context
  }
  
  async closeSession(sessionId: string): Promise<void> {
    // Save session state
    // Close iTerm tab
    // Cleanup resources
    // Remove from registry
  }
}
```

### 2. Session Data Model

```typescript
interface Session {
  // Identification
  id: string;                    // Unique session identifier
  name: string;                  // Human-readable session name
  
  // iTerm References
  windowId: string;              // iTerm window identifier
  tabId: string;                 // iTerm tab identifier
  tabIndex: number;              // Tab position in window
  
  // State Management
  state: SessionState;           // Current session state
  context: SessionContext;       // Session-specific data
  
  // Agent Association
  agentId?: string;              // Assigned Claude instance
  role?: AgentRole;              // Agent's role in workflow
  
  // Metadata
  created: Date;                 // Session creation time
  lastActive: Date;              // Last interaction time
  tags: string[];                // Categorization tags
}

interface SessionContext {
  // Environment
  workingDirectory: string;
  environment: Record<string, string>;
  shellType: 'bash' | 'zsh' | 'fish';
  
  // History
  commandHistory: Command[];
  outputBuffer: OutputLine[];
  
  // State
  variables: Record<string, any>;
  runningProcesses: Process[];
  exitCode?: number;
}

type SessionState = 
  | 'initializing'   // Being created
  | 'ready'          // Available for commands
  | 'busy'           // Executing command
  | 'waiting'        // Awaiting user input
  | 'error'          // In error state
  | 'closing';       // Being terminated
```

### 3. AppleScript Integration Layer

```typescript
class AppleScriptBridge {
  async createTab(profile: string = "Default"): Promise<TabInfo> {
    const script = `
      tell application "iTerm2"
        tell current window
          set newTab to (create tab with profile "${profile}")
          set tabId to id of newTab
          set tabIndex to index of newTab
          return {tabId, tabIndex}
        end tell
      end tell
    `;
    return this.executeScript(script);
  }
  
  async switchToTab(windowId: string, tabId: string): Promise<void> {
    const script = `
      tell application "iTerm2"
        tell window id "${windowId}"
          select tab id "${tabId}"
        end tell
      end tell
    `;
    await this.executeScript(script);
  }
  
  async setSessionVariable(tabId: string, name: string, value: string): Promise<void> {
    const script = `
      tell application "iTerm2"
        tell current window
          tell tab id "${tabId}"
            tell current session
              set variable named "${name}" to "${value}"
            end tell
          end tell
        end tell
      end tell
    `;
    await this.executeScript(script);
  }
}
```

## Multi-Session MCP Tools

### 1. Session Management Tools

```typescript
// Create a new session
{
  name: "create_session",
  description: "Create a new iTerm session",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Session name" },
      profile: { type: "string", description: "iTerm profile to use" },
      workingDirectory: { type: "string", description: "Initial directory" },
      environment: { type: "object", description: "Environment variables" }
    }
  }
}

// List all sessions
{
  name: "list_sessions",
  description: "List all managed sessions",
  inputSchema: {
    type: "object",
    properties: {
      filter: { 
        type: "object",
        properties: {
          state: { type: "string", enum: ["ready", "busy", "error"] },
          agentId: { type: "string" },
          tags: { type: "array", items: { type: "string" } }
        }
      }
    }
  }
}

// Switch active session
{
  name: "switch_session",
  description: "Switch to a different session",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: { type: "string", description: "Target session ID" }
    },
    required: ["sessionId"]
  }
}
```

### 2. Session Context Tools

```typescript
// Get session information
{
  name: "get_session_info",
  description: "Get detailed session information",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: { type: "string" },
      includeHistory: { type: "boolean", default: false },
      includeEnvironment: { type: "boolean", default: true }
    }
  }
}

// Store session data
{
  name: "set_session_data",
  description: "Store data in session context",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: { type: "string" },
      key: { type: "string" },
      value: { type: "any" }
    }
  }
}
```

## Session Lifecycle Management

### Creation Flow
```
1. Client requests new session
2. SessionManager generates unique ID
3. AppleScriptBridge creates iTerm tab
4. Session context initialized
5. Working directory set
6. Environment variables configured
7. Session registered and marked ready
8. Session ID returned to client
```

### Switching Flow
```
1. Validate target session exists
2. Save current session state
3. AppleScript focuses target tab
4. Restore target session context
5. Update active session reference
6. Notify state change
```

### Cleanup Flow
```
1. Mark session as closing
2. Save final session state
3. Terminate running processes
4. Close iTerm tab
5. Remove from session registry
6. Archive session data
```

## State Synchronization

### Session State Tracking
- Monitor command execution status
- Track process lifecycle
- Detect user interactions
- Handle unexpected terminations

### Context Preservation
- Automatic working directory tracking
- Environment variable snapshots
- Command history buffering
- Output caching strategies

## Performance Optimizations

### 1. Lazy Loading
- Initialize sessions on-demand
- Defer context loading until needed
- Stream output instead of buffering all

### 2. Caching Strategy
- Cache iTerm object references
- Memoize AppleScript results
- Batch state updates

### 3. Resource Management
- Limit concurrent sessions
- Implement session timeout
- Automatic garbage collection

## Error Handling

### Common Scenarios
1. **iTerm Not Running**: Auto-launch or graceful failure
2. **Tab Closed Externally**: Detect and cleanup orphaned sessions
3. **AppleScript Timeout**: Retry with exponential backoff
4. **Session Conflicts**: Implement locking mechanisms

### Recovery Strategies
```typescript
class SessionRecovery {
  async recoverSession(sessionId: string): Promise<Session> {
    // Attempt to find iTerm tab
    // Reconstruct session state
    // Re-establish context
    // Or create replacement session
  }
  
  async handleOrphanedSessions(): Promise<void> {
    // Scan for untracked iTerm tabs
    // Match against known sessions
    // Cleanup or adopt orphans
  }
}
```

## Integration with Claude Code

### Agent Assignment
```typescript
interface AgentSessionBinding {
  agentId: string;
  sessionId: string;
  permissions: Permission[];
  sharedContext: SharedContext;
}

class AgentCoordinator {
  async assignAgentToSession(
    agentId: string, 
    sessionId: string,
    role: AgentRole
  ): Promise<void> {
    // Validate agent and session
    // Create binding
    // Configure permissions
    // Initialize shared context
  }
}
```

### Inter-Session Communication
- Shared memory bank for data exchange
- Event bus for coordination
- Task queue for work distribution
- Result aggregation mechanisms

## Security Considerations

### Session Isolation
- Separate environment per session
- No cross-session command execution
- Scoped variable access
- Permission-based operations

### Audit Trail
```typescript
interface SessionAudit {
  sessionId: string;
  timestamp: Date;
  action: AuditAction;
  agentId?: string;
  details: Record<string, any>;
}
```

## Migration Path

### Phase 1: Single to Multi
1. Extend existing tools with session parameter
2. Default to "main" session for compatibility
3. Gradually introduce session management

### Phase 2: Full Multi-Session
1. Deprecate single-session mode
2. Require explicit session management
3. Provide migration tooling

## Testing Strategy

### Unit Tests
- Session lifecycle operations
- AppleScript command generation
- State management logic
- Error handling paths

### Integration Tests
- Real iTerm interaction
- Multi-session scenarios
- Agent coordination
- Performance benchmarks

## Conclusion

This multi-session architecture provides the foundation for powerful terminal orchestration while maintaining the simplicity and reliability of the original iTerm MCP. The design prioritizes backward compatibility, performance, and extensibility to support complex multi-agent workflows.