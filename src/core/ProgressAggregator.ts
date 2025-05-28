import { v4 as uuidv4 } from 'uuid';

export interface TaskProgress {
  sessionId: string;
  taskId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  output: string[];
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface AggregatedProgress {
  id: string;
  mainTaskId: string;
  subtasks: Map<string, TaskProgress>;
  overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed' | 'partial';
  startTime: Date;
  endTime?: Date;
  summary?: string;
}

export class ProgressAggregator {
  private progressMap: Map<string, AggregatedProgress> = new Map();
  
  /**
   * Create a new aggregated progress tracker
   */
  createAggregation(mainTaskId: string, sessionIds: string[]): string {
    const aggregationId = uuidv4();
    const subtasks = new Map<string, TaskProgress>();
    
    // Initialize subtasks for each session
    sessionIds.forEach(sessionId => {
      subtasks.set(sessionId, {
        sessionId,
        taskId: `${mainTaskId}-${sessionId}`,
        status: 'pending',
        output: [],
        startTime: new Date()
      });
    });
    
    const aggregation: AggregatedProgress = {
      id: aggregationId,
      mainTaskId,
      subtasks,
      overallStatus: 'pending',
      startTime: new Date()
    };
    
    this.progressMap.set(aggregationId, aggregation);
    return aggregationId;
  }
  
  /**
   * Update progress for a specific session
   */
  updateProgress(
    aggregationId: string,
    sessionId: string,
    update: Partial<TaskProgress>
  ): void {
    const aggregation = this.progressMap.get(aggregationId);
    if (!aggregation) {
      throw new Error(`Aggregation ${aggregationId} not found`);
    }
    
    const subtask = aggregation.subtasks.get(sessionId);
    if (!subtask) {
      throw new Error(`Session ${sessionId} not found in aggregation`);
    }
    
    // Update subtask
    Object.assign(subtask, update);
    
    // Update overall status
    this.updateOverallStatus(aggregation);
  }
  
  /**
   * Add output from a session
   */
  addOutput(aggregationId: string, sessionId: string, output: string): void {
    const aggregation = this.progressMap.get(aggregationId);
    if (!aggregation) {
      throw new Error(`Aggregation ${aggregationId} not found`);
    }
    
    const subtask = aggregation.subtasks.get(sessionId);
    if (!subtask) {
      throw new Error(`Session ${sessionId} not found in aggregation`);
    }
    
    subtask.output.push(output);
  }
  
  /**
   * Get current aggregated progress
   */
  getProgress(aggregationId: string): AggregatedProgress | undefined {
    return this.progressMap.get(aggregationId);
  }
  
  /**
   * Get all active aggregations
   */
  getAllAggregations(): AggregatedProgress[] {
    return Array.from(this.progressMap.values());
  }
  
  /**
   * Synthesize results from all subtasks
   */
  synthesizeResults(aggregationId: string): string {
    const aggregation = this.progressMap.get(aggregationId);
    if (!aggregation) {
      throw new Error(`Aggregation ${aggregationId} not found`);
    }
    
    const results: string[] = [];
    results.push(`# Task: ${aggregation.mainTaskId}`);
    results.push(`Overall Status: ${aggregation.overallStatus}`);
    results.push('');
    
    // Collect results from each subtask
    aggregation.subtasks.forEach((subtask, sessionId) => {
      results.push(`## Session: ${sessionId}`);
      results.push(`Status: ${subtask.status}`);
      
      if (subtask.error) {
        results.push(`Error: ${subtask.error}`);
      }
      
      if (subtask.output.length > 0) {
        results.push('Output:');
        subtask.output.forEach(line => {
          results.push(`  ${line}`);
        });
      }
      
      results.push('');
    });
    
    // Add summary if available
    if (aggregation.summary) {
      results.push('## Summary');
      results.push(aggregation.summary);
    }
    
    return results.join('\n');
  }
  
  /**
   * Detect if all subtasks are complete
   */
  isComplete(aggregationId: string): boolean {
    const aggregation = this.progressMap.get(aggregationId);
    if (!aggregation) {
      return false;
    }
    
    return aggregation.overallStatus === 'completed' || 
           aggregation.overallStatus === 'failed';
  }
  
  /**
   * Update overall status based on subtask statuses
   */
  private updateOverallStatus(aggregation: AggregatedProgress): void {
    const statuses = Array.from(aggregation.subtasks.values()).map(t => t.status);
    
    if (statuses.every(s => s === 'completed')) {
      aggregation.overallStatus = 'completed';
      aggregation.endTime = new Date();
    } else if (statuses.some(s => s === 'failed')) {
      aggregation.overallStatus = 'failed';
      aggregation.endTime = new Date();
    } else if (statuses.some(s => s === 'in-progress')) {
      aggregation.overallStatus = 'in-progress';
    } else if (statuses.some(s => s === 'completed')) {
      aggregation.overallStatus = 'partial';
    } else {
      aggregation.overallStatus = 'pending';
    }
  }
  
  /**
   * Generate intelligent summary of results
   */
  async generateSummary(aggregationId: string): Promise<string> {
    const aggregation = this.progressMap.get(aggregationId);
    if (!aggregation) {
      throw new Error(`Aggregation ${aggregationId} not found`);
    }
    
    // Collect all outputs
    const allOutputs: string[] = [];
    aggregation.subtasks.forEach(subtask => {
      allOutputs.push(...subtask.output);
    });
    
    // In a real implementation, this could use Claude to generate
    // an intelligent summary of the combined outputs
    const summary = this.createBasicSummary(aggregation, allOutputs);
    aggregation.summary = summary;
    
    return summary;
  }
  
  /**
   * Create a basic summary without AI
   */
  private createBasicSummary(
    aggregation: AggregatedProgress,
    outputs: string[]
  ): string {
    const completedCount = Array.from(aggregation.subtasks.values())
      .filter(t => t.status === 'completed').length;
    const totalCount = aggregation.subtasks.size;
    
    const duration = aggregation.endTime 
      ? aggregation.endTime.getTime() - aggregation.startTime.getTime()
      : Date.now() - aggregation.startTime.getTime();
    
    const durationMinutes = Math.round(duration / 60000);
    
    return `Task ${aggregation.mainTaskId} completed with ${completedCount}/${totalCount} subtasks successful. Total duration: ${durationMinutes} minutes. Combined output contains ${outputs.length} entries.`;
  }
  
  /**
   * Clean up completed aggregations
   */
  cleanup(olderThanMinutes: number = 60): number {
    const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
    let removedCount = 0;
    
    this.progressMap.forEach((aggregation, id) => {
      if (aggregation.endTime && aggregation.endTime.getTime() < cutoffTime) {
        this.progressMap.delete(id);
        removedCount++;
      }
    });
    
    return removedCount;
  }
}