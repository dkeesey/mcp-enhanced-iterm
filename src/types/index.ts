export interface Session {
  id: string;
  windowId: string;
  tabId: string;
  name: string;
  state: 'active' | 'idle' | 'busy';
  context: SessionContext;
  agentId?: string;
  created: Date;
  lastActive: Date;
}

export interface SessionContext {
  workingDirectory: string;
  environment: Record<string, string>;
  history: Command[];
  variables: Record<string, any>;
}

export interface Command {
  id: string;
  command: string;
  timestamp: Date;
  output?: string;
  exitCode?: number;
}

export interface AgentAssignment {
  agentId: string;
  sessionId: string;
  role: 'primary' | 'support' | 'monitor';
  permissions: Permission[];
  taskQueue: Task[];
}

export type Permission = 'read' | 'write' | 'execute' | 'admin';

export interface Task {
  id: string;
  type: string;
  payload: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}