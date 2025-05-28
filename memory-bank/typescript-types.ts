/**
 * TypeScript Type Definitions for Enhanced iTerm MCP
 * Complete type system for multi-session management and orchestration
 */

// ============================================================================
// Core Session Types
// ============================================================================

/**
 * Represents a managed iTerm session
 */
export interface Session {
  // Identification
  id: string;                    // Unique session identifier (e.g., "sess-123")
  name: string;                  // Human-readable session name
  
  // iTerm References
  windowId: string;              // iTerm window identifier
  tabId: string;                 // iTerm tab identifier
  tabIndex: number;              // Tab position in window (1-based)
  
  // State Management
  state: SessionState;           // Current session state
  context: SessionContext;       // Session-specific data and environment
  
  // Agent Association (optional)
  agentId?: string;              // Assigned Claude instance ID
  role?: AgentRole;              // Agent's role in workflow
  
  // Metadata
  created: Date;                 // Session creation timestamp
  lastActive: Date;              // Last interaction timestamp
  tags: string[];                // Categorization tags
  
  // Performance Metrics
  metrics?: SessionMetrics;      // Optional performance data
}

/**
 * Session lifecycle states
 */
export type SessionState = 
  | 'initializing'    // Being created
  | 'ready'           // Available for commands
  | 'busy'            // Executing command
  | 'waiting'         // Awaiting user input
  | 'error'           // In error state
  | 'closing';        // Being terminated

/**
 * Session-specific context and environment
 */
export interface SessionContext {
  // Environment
  workingDirectory: string;
  environment: Record<string, string>;
  shellType: ShellType;
  
  // History
  commandHistory: Command[];
  outputBuffer: OutputLine[];
  
  // State
  variables: Record<string, any>;
  runningProcesses: Process[];
  exitCode?: number;
  
  // Shell Integration
  shellIntegration?: ShellIntegration;
}

/**
 * Supported shell types
 */
export type ShellType = 'bash' | 'zsh' | 'fish' | 'sh';

/**
 * Command execution record
 */
export interface Command {
  id: string;
  text: string;
  timestamp: Date;
  duration?: number;
  exitCode?: number;
  output?: string;
}

/**
 * Terminal output line
 */
export interface OutputLine {
  lineNumber: number;
  text: string;
  timestamp: Date;
  type: 'stdout' | 'stderr' | 'system';
}

/**
 * Running process information
 */
export interface Process {
  pid: number;
  command: string;
  startTime: Date;
  state: 'running' | 'stopped' | 'terminated';
}

/**
 * Shell integration features
 */
export interface ShellIntegration {
  available: boolean;
  version?: string;
  features: ShellFeature[];
}

export type ShellFeature = 
  | 'prompt_detection'
  | 'command_status'
  | 'directory_tracking'
  | 'command_timing';

/**
 * Session performance metrics
 */
export interface SessionMetrics {
  commandCount: number;
  avgResponseTime: number;
  errorRate: number;
  uptime: number;
}

// ============================================================================
// Session Management Types
// ============================================================================

/**
 * Options for creating a new session
 */
export interface SessionOptions {
  name?: string;
  profile?: string;              // iTerm profile name
  workingDirectory?: string;
  environment?: Record<string, string>;
  tags?: string[];
  agentId?: string;
  windowPreference?: WindowPreference;
}

/**
 * Window creation preference
 */
export type WindowPreference = 'current' | 'new' | 'tab';

/**
 * Session filter criteria
 */
export interface SessionFilter {
  state?: SessionState | SessionState[];
  agentId?: string;
  tags?: string[];
  name?: string | RegExp;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * Session operation result
 */
export interface SessionResult<T = any> {
  success: boolean;
  sessionId: string;
  data?: T;
  error?: string;
  duration?: number;
}

// ============================================================================
// Agent Orchestration Types
// ============================================================================

/**
 * Represents a Claude Code agent instance
 */
export interface AgentInstance {
  // Identity
  id: string;
  name: string;
  type: AgentType;
  
  // Session Binding
  sessionId?: string;
  sessionAccess: SessionAccessLevel;
  
  // Capabilities
  capabilities: AgentCapability[];
  restrictions: SecurityRestriction[];
  
  // State
  status: AgentStatus;
  currentTask?: Task;
  taskHistory: TaskExecution[];
  
  // Communication
  messageQueue: MessageQueue;
  sharedMemory: SharedMemoryAccess;
  
  // Metadata
  created: Date;
  lastActive: Date;
  config: AgentConfig;
}

/**
 * Agent types for different roles
 */
export type AgentType = 'primary' | 'worker' | 'specialist' | 'monitor';

/**
 * Agent roles in workflows
 */
export type AgentRole = 
  | 'coordinator'      // Orchestrates other agents
  | 'executor'         // Executes tasks
  | 'validator'        // Validates results
  | 'reporter';        // Reports progress

/**
 * Session access levels for agents
 */
export type SessionAccessLevel = 'read' | 'write' | 'admin';

/**
 * Agent capabilities
 */
export type AgentCapability = 
  | 'file_operations'
  | 'network_access'
  | 'process_management'
  | 'system_commands'
  | 'code_generation'
  | 'testing'
  | 'deployment';

/**
 * Agent operational status
 */
export type AgentStatus = 
  | 'initializing'
  | 'idle'
  | 'working'
  | 'waiting'
  | 'error'
  | 'terminated';

/**
 * Agent configuration
 */
export interface AgentConfig {
  name: string;
  type: AgentType;
  capabilities?: AgentCapability[];
  sessionOptions?: SessionOptions;
  permissions?: Permission[];
  autoStart?: boolean;
}

// ============================================================================
// Task and Workflow Types
// ============================================================================

/**
 * Represents a task to be executed
 */
export interface Task {
  id: string;
  name: string;
  type: TaskType;
  priority: TaskPriority;
  
  // Execution
  command?: string;
  script?: string;
  handler?: string;
  
  // Requirements
  requirements: Requirement[];
  dependencies: string[];        // Task IDs that must complete first
  
  // Configuration
  timeout: number;
  retryPolicy: RetryPolicy;
  continueOnError: boolean;
  
  // Data
  input?: any;
  expectedOutput?: any;
  validation?: ValidationRule[];
}

/**
 * Task types
 */
export type TaskType = 
  | 'command'         // Shell command execution
  | 'script'          // Script file execution
  | 'function'        // Function call
  | 'workflow';       // Nested workflow

/**
 * Task priority levels
 */
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Task execution record
 */
export interface TaskExecution {
  taskId: string;
  agentId: string;
  sessionId: string;
  
  startTime: Date;
  endTime?: Date;
  duration?: number;
  
  status: TaskStatus;
  result?: any;
  error?: Error;
  
  attempts: number;
  output?: string;
}

/**
 * Task execution status
 */
export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  version: string;
  
  // Structure
  stages: WorkflowStage[];
  agents?: AgentConfig[];
  
  // Configuration
  parallel?: boolean;
  timeout?: number;
  continueOnError?: boolean;
  
  // Hooks
  onStart?: Hook;
  onComplete?: Hook;
  onError?: Hook;
}

/**
 * Workflow stage
 */
export interface WorkflowStage {
  name: string;
  tasks: Task[];
  
  parallel?: boolean;
  dependsOn?: string[];         // Stage names
  condition?: Condition;
  
  timeout?: number;
  retryPolicy?: RetryPolicy;
}

// ============================================================================
// Communication Types
// ============================================================================

/**
 * Inter-agent message
 */
export interface AgentMessage {
  id: string;
  from: string;                  // Agent ID
  to: string | string[];         // Agent ID(s) or 'broadcast'
  
  type: MessageType;
  priority: MessagePriority;
  
  subject: string;
  content: any;
  
  timestamp: Date;
  requiresAck: boolean;
  timeout?: number;
}

/**
 * Message types
 */
export type MessageType = 
  | 'request'
  | 'response'
  | 'notification'
  | 'command'
  | 'event';

/**
 * Message priority
 */
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Shared memory segment
 */
export interface MemorySegment {
  key: string;
  data: any;
  
  owner: string;                 // Agent ID
  access: AccessLevel;
  
  created: Date;
  modified: Date;
  expires?: Date;
  
  subscribers: string[];         // Agent IDs
  version: number;
}

/**
 * Memory access levels
 */
export type AccessLevel = 'private' | 'shared' | 'public';

/**
 * Event for event bus
 */
export interface OrchestratorEvent {
  id: string;
  type: EventType;
  
  source: string;                // Agent or system
  target?: string;               // Specific agent or broadcast
  
  payload: any;
  metadata?: EventMetadata;
  
  timestamp: Date;
}

/**
 * Event types
 */
export type EventType = 
  | 'task.created'
  | 'task.assigned'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  | 'agent.ready'
  | 'agent.busy'
  | 'agent.error'
  | 'session.created'
  | 'session.closed'
  | 'data.shared'
  | 'coordination.request';

/**
 * Event metadata
 */
export interface EventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  tags?: string[];
}

// ============================================================================
// MCP Protocol Extensions
// ============================================================================

/**
 * Extended MCP tool definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: JSONSchema;
  
  // Extensions
  category?: ToolCategory;
  permissions?: Permission[];
  rateLimit?: RateLimit;
  timeout?: number;
}

/**
 * Tool categories
 */
export type ToolCategory = 
  | 'session'         // Session management
  | 'execution'       // Command execution
  | 'orchestration'   // Agent coordination
  | 'monitoring'      // System monitoring
  | 'utility';        // General utilities

/**
 * Tool permissions
 */
export type Permission = 
  | 'session:read'
  | 'session:write'
  | 'session:create'
  | 'session:delete'
  | 'command:execute'
  | 'agent:coordinate'
  | 'data:share'
  | 'system:admin';

/**
 * Rate limiting configuration
 */
export interface RateLimit {
  requests: number;
  window: number;               // milliseconds
  burst?: number;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Base error class for all MCP errors
 */
export class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

/**
 * Session-related errors
 */
export class SessionError extends MCPError {
  constructor(
    public sessionId: string,
    code: string,
    message: string,
    details?: any
  ) {
    super(code, message, details);
    this.name = 'SessionError';
  }
}

/**
 * AppleScript execution errors
 */
export class AppleScriptError extends MCPError {
  constructor(
    public script: string,
    public exitCode: number,
    message: string
  ) {
    super('APPLESCRIPT_ERROR', message);
    this.name = 'AppleScriptError';
  }
}

/**
 * Orchestration errors
 */
export class OrchestrationError extends MCPError {
  constructor(
    public agents: string[],
    code: string,
    message: string
  ) {
    super(code, message);
    this.name = 'OrchestrationError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * JSON Schema type (simplified)
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: any[];
  description?: string;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  field: string;
  rule: 'required' | 'regex' | 'range' | 'custom';
  value?: any;
  message?: string;
}

/**
 * Execution condition
 */
export interface Condition {
  type: 'expression' | 'script' | 'function';
  value: string;
  context?: Record<string, any>;
}

/**
 * Hook definition
 */
export interface Hook {
  type: 'command' | 'function' | 'webhook';
  target: string;
  timeout?: number;
}

/**
 * Security restriction
 */
export interface SecurityRestriction {
  type: RestrictionType;
  target?: string;
  action: 'allow' | 'deny';
  reason?: string;
}

/**
 * Restriction types
 */
export type RestrictionType = 
  | 'command'
  | 'directory'
  | 'network'
  | 'process'
  | 'file';

/**
 * Message queue interface
 */
export interface MessageQueue {
  send(message: AgentMessage): Promise<void>;
  receive(filter?: MessageFilter): Promise<AgentMessage[]>;
  acknowledge(messageId: string): Promise<void>;
  peek(count?: number): Promise<AgentMessage[]>;
}

/**
 * Message filter
 */
export interface MessageFilter {
  from?: string;
  type?: MessageType;
  priority?: MessagePriority;
  since?: Date;
  limit?: number;
}

/**
 * Shared memory access interface
 */
export interface SharedMemoryAccess {
  read(key: string): Promise<any>;
  write(key: string, data: any, options?: MemoryOptions): Promise<void>;
  subscribe(pattern: string, callback: (data: any) => void): Promise<void>;
  unsubscribe(pattern: string): Promise<void>;
}

/**
 * Memory operation options
 */
export interface MemoryOptions {
  access?: AccessLevel;
  ttl?: number;                 // Time to live in ms
  overwrite?: boolean;
}

/**
 * Task requirement
 */
export interface Requirement {
  type: 'capability' | 'resource' | 'permission';
  value: string;
  optional?: boolean;
}

/**
 * Tab information from AppleScript
 */
export interface TabInfo {
  windowId: string;
  tabId: string;
  tabIndex: number;
}

/**
 * Error context for debugging
 */
export interface ErrorContext {
  sessionId?: string;
  agentId?: string;
  taskId?: string;
  command?: string;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, any>;
}

/**
 * Error recovery result
 */
export interface ErrorRecovery {
  recovered: boolean;
  action: string;
  retry?: boolean;
  data?: any;
  error?: string;
}