import { v4 as uuidv4 } from 'uuid';
export class TaskDistributor {
    sessionManager;
    claudeIntegration;
    activeTasks = new Map();
    constructor(sessionManager, claudeIntegration, _strategy) {
        this.sessionManager = sessionManager;
        this.claudeIntegration = claudeIntegration;
        // Strategy parameter reserved for future use
    }
    /**
     * Distribute a complex task across multiple sessions
     */
    async distributeTask(mainPrompt, subtaskPrompts) {
        const taskId = uuidv4();
        // Create subtasks
        const subtasks = subtaskPrompts.map((prompt, index) => ({
            id: `${taskId}-sub-${index}`,
            prompt,
            dependencies: [], // Can be enhanced to support dependencies
            status: 'pending'
        }));
        const distributedTask = {
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
        }
        catch (error) {
            distributedTask.status = 'failed';
            throw error;
        }
    }
    /**
     * Execute the task distribution
     */
    async executeDistribution(task) {
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
    assignSubtasksToSessions(subtasks, sessions) {
        const assignments = new Map();
        // Round-robin assignment
        let sessionIndex = 0;
        for (const subtask of subtasks) {
            const session = sessions[sessionIndex % sessions.length];
            if (!session?.id)
                continue;
            subtask.sessionId = session.id;
            subtask.status = 'assigned';
            if (!assignments.has(session.id)) {
                assignments.set(session.id, []);
            }
            assignments.get(session.id).push(subtask);
            sessionIndex++;
        }
        return assignments;
    }
    /**
     * Create an intelligent task breakdown using Claude
     */
    async createIntelligentTaskBreakdown(complexPrompt) {
        // Create a simple breakdown using basic parsing for now
        return this.createTaskBreakdown(complexPrompt);
    }
    /**
     * Execute subtasks in their assigned sessions
     */
    async executeSubtasks(assignments) {
        const results = new Map();
        // Execute tasks in parallel per session
        const sessionPromises = Array.from(assignments.entries()).map(async ([sessionId, subtasks]) => {
            for (const subtask of subtasks) {
                try {
                    subtask.status = 'in_progress';
                    // Update session state
                    this.sessionManager.updateSessionState(sessionId, 'busy');
                    // Execute the subtask
                    const result = await this.claudeIntegration.promptClaudeCode(sessionId, subtask.prompt);
                    subtask.status = 'completed';
                    subtask.result = result;
                    results.set(subtask.id, result);
                    // Update session state back to idle
                    this.sessionManager.updateSessionState(sessionId, 'idle');
                }
                catch (error) {
                    subtask.status = 'failed';
                    subtask.error = error instanceof Error ? error.message : String(error);
                    // Update session state back to idle even on error
                    this.sessionManager.updateSessionState(sessionId, 'idle');
                    throw error;
                }
            }
        });
        await Promise.all(sessionPromises);
        return results;
    }
    async createTaskBreakdown(complexPrompt) {
        // This is a simplified version - in a real implementation,
        // you might use Claude to help break down the task
        const keywords = ['and', 'then', 'also', 'additionally'];
        let subtasks = [];
        // Simple split by keywords
        let currentTask = complexPrompt;
        for (const keyword of keywords) {
            const parts = currentTask.split(` ${keyword} `);
            if (parts.length > 1) {
                subtasks.push(parts[0]);
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
    getActiveTasks() {
        return Array.from(this.activeTasks.values()).filter(t => t.status === 'in_progress' || t.status === 'pending');
    }
    /**
     * Get a specific task by ID
     */
    getTask(taskId) {
        return this.activeTasks.get(taskId);
    }
    /**
     * Cancel a distributed task
     */
    async cancelTask(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task)
            return;
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
//# sourceMappingURL=TaskDistributor.js.map