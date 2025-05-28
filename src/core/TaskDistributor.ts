import { SessionManager } from '../session/SessionManager.js';
import { ClaudeCodeIntegration } from './ClaudeCodeIntegration.js';
import { Session } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface DistributedTask {
  id: string;
  mainPrompt: string;
  subtasks: Subtask[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  results?: Map<string, string>;
}

export interface Subtask {
  id: string;
  sessionId?: string;
  prompt: string;
  dependencies: string[]; // IDs of subtasks this depends on
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

export interface TaskDistributionStrategy {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryAttempts: number;
}

export class TaskDistributor {
  private sessionManager: SessionManager;
  private claudeIntegration: ClaudeCodeIntegration;
  private activeTasks: Map<string, DistributedTask> = new Map();

  constructor(
    sessionManager: SessionManager,
    claudeIntegration: ClaudeCodeIntegration,
    _strategy?: Partial<TaskDistributionStrategy>
  ) {
    this.sessionManager = sessionManager;
    this.claudeIntegration = claudeIntegration;
    // Strategy parameter reserved for future use
  }

  /**
   * Distribute a complex task across multiple sessions
   */
  async distributeTask(mainPrompt: string, subtaskPrompts: string[]): Promise<DistributedTask> {
    const taskId = uuidv4();
    
    // Create subtasks
    const subtasks: Subtask[] = subtaskPrompts.map((prompt, index) => ({
      id: `${taskId}-sub-${index}`,
      prompt,
      dependencies: [], // Can be enhanced to support dependencies
      status: 'pending' as const
    }));
    
    const distributedTask: DistributedTask = {
      id: taskId,
      mainPrompt,
      subtasks,
      status: 'pending',
      createdAt: new Date()
    };
    
    this.activeTasks.set(taskId, distributedTask);
    
    try {
      // Execute the distribution
      await this.executeDistribution(distributedTask);
      
      distributedTask.status = 'completed';
      distributedTask.completedAt = new Date();
      
      return distributedTask;
    } catch (error) {
      distributedTask.status = 'failed';
      throw error;
    }
  }

  /**
   * Execute the task distribution
   */
  private async executeDistribution(task: DistributedTask): Promise<void> {
    task.status = 'in_progress';
    
    // Get available sessions
    const sessions = await this.sessionManager.enumerateSessions();
    const idleSessions = sessions.filter(s => s.state === 'idle');
    
    if (idleSessions.length === 0) {
      throw new Error('No idle sessions available for task distribution');
    }
    
    // Assign subtasks to sessions
    const assignments = this.assignSubtasksToSessions(task.subtasks, idleSessions);
    
    // Execute subtasks in parallel
    const results = await this.executeSubtasks(assignments);
    
    // Store results
    task.results = results;
  }

  /**
   * Assign subtasks to available sessions
   */
  private assignSubtasksToSessions(
    subtasks: Subtask[],
    sessions: Session[]
  ): Map<string, Subtask[]> {
    const assignments = new Map<string, Subtask[]>();
    
    // Round-robin assignment
    let sessionIndex = 0;
    for (const subtask of subtasks) {
      const session = sessions[sessionIndex % sessions.length];
      if (!session?.id) continue;
      
      subtask.sessionId = session.id;
      subtask.status = 'assigned';
      
      if (!assignments.has(session.id)) {
        assignments.set(session.id, []);
      }
      assignments.get(session.id)!.push(subtask);
      
      sessionIndex++;
    }
    
    return assignments;
  }

  /**
   * Create an intelligent task breakdown using Claude
   */
  async createIntelligentTaskBreakdown(complexPrompt: string): Promise<string[]> {
    // Create a simple breakdown using basic parsing for now
    return this.createTaskBreakdown(complexPrompt);
  }

  /**
   * Execute subtasks in their assigned sessions
   */
  private async executeSubtasks(
    assignments: Map<string, Subtask[]>
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Execute tasks in parallel per session
    const sessionPromises = Array.from(assignments.entries()).map(
      async ([sessionId, subtasks]) => {
        for (const subtask of subtasks) {
          try {
            subtask.status = 'in_progress';
            
            // Update session state
            this.sessionManager.updateSessionState(sessionId, 'busy');
            
            // Execute the subtask
            const result = await this.claudeIntegration.promptClaudeCode(
              sessionId,
              subtask.prompt
            );
            
            subtask.status = 'completed';
            subtask.result = result;
            results.set(subtask.id, result);
            
            // Update session state back to idle
            this.sessionManager.updateSessionState(sessionId, 'idle');
          } catch (error) {
            subtask.status = 'failed';
            subtask.error = error instanceof Error ? error.message : String(error);
            
            // Update session state back to idle even on error
            this.sessionManager.updateSessionState(sessionId, 'idle');
            
            throw error;
          }
        }
      }
    );
    
    await Promise.all(sessionPromises);
    return results;
  }

  async createTaskBreakdown(complexPrompt: string): Promise<string[]> {
    // This is a simplified version - in a real implementation,
    // you might use Claude to help break down the task
    const keywords = ['and', 'then', 'also', 'additionally'];
    let subtasks: string[] = [];
    
    // Simple split by keywords
    let currentTask = complexPrompt;
    for (const keyword of keywords) {
      const parts = currentTask.split(` ${keyword} `);
      if (parts.length > 1) {
        subtasks.push(parts[0]!);
        currentTask = parts.slice(1).join(` ${keyword} `);
      }
    }
    
    // Add the remaining part
    if (currentTask.trim()) {
      subtasks.push(currentTask.trim());
    }
    
    // If no splits were made, return the original as a single task
    if (subtasks.length === 0) {
      subtasks = [complexPrompt];
    }
    
    return subtasks;
  }

  /**
   * Get status of active distributed tasks
   */
  getActiveTasks(): DistributedTask[] {
    return Array.from(this.activeTasks.values()).filter(
      t => t.status === 'in_progress' || t.status === 'pending'
    );
  }

  /**
   * Get a specific task by ID
   */
  getTask(taskId: string): DistributedTask | undefined {
    return this.activeTasks.get(taskId);
  }

  /**
   * Cancel a distributed task
   */
  async cancelTask(taskId: string): Promise<void> {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    task.status = 'failed';
    
    // Update all pending/in-progress subtasks
    for (const subtask of task.subtasks) {
      if (subtask.status === 'pending' || subtask.status === 'in_progress') {
        subtask.status = 'failed';
        subtask.error = 'Task cancelled';
        
        // Reset session state if assigned
        if (subtask.sessionId) {
          this.sessionManager.updateSessionState(subtask.sessionId, 'idle');
        }
      }
    }
  }
}