#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { SessionManager } from './session/SessionManager.js';
import { CommandExecutor } from './core/CommandExecutor.js';
import { ProcessTracker } from './core/ProcessTracker.js';
import { ClaudeCodeIntegration } from './core/ClaudeCodeIntegration.js';
import { TaskDistributor } from './core/TaskDistributor.js';
import { ProgressAggregator } from './core/ProgressAggregator.js';
import { ErrorRecovery } from './core/ErrorRecovery.js';
import { SafetyTiers } from './core/SafetyTiers.js';
import { PerformanceMonitor } from './core/PerformanceMonitor.js';
import { WaltOpieValidation } from './validation/WaltOpieValidation.js';
const server = new Server({
    name: 'enhanced-iterm-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Initialize all components
const sessionManager = new SessionManager();
const commandExecutor = new CommandExecutor();
const processTracker = new ProcessTracker();
const claudeIntegration = new ClaudeCodeIntegration(commandExecutor);
const taskDistributor = new TaskDistributor(sessionManager, claudeIntegration);
const progressAggregator = new ProgressAggregator();
const errorRecovery = new ErrorRecovery(sessionManager, commandExecutor, processTracker);
const safetyTiers = new SafetyTiers(commandExecutor);
const performanceMonitor = new PerformanceMonitor(processTracker, sessionManager);
const waltOpieValidation = new WaltOpieValidation(sessionManager, taskDistributor, progressAggregator, safetyTiers, performanceMonitor, errorRecovery);
// Start monitoring
errorRecovery.startHealthMonitoring();
performanceMonitor.startMonitoring();
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        // Backward compatible tools
        {
            name: 'write_to_terminal',
            description: 'Write a command or text to the active iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    text: {
                        type: 'string',
                        description: 'The text or command to write to the terminal',
                    },
                },
                required: ['text'],
            },
        },
        {
            name: 'read_terminal_output',
            description: 'Read recent output from the active iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    lines: {
                        type: 'number',
                        description: 'Number of lines to read (default: 50)',
                        default: 50,
                    },
                },
            },
        },
        {
            name: 'send_control_character',
            description: 'Send a control character to the active iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    character: {
                        type: 'string',
                        description: 'Control character to send (e.g., "c" for Ctrl-C)',
                        enum: ['c', 'd', 'z', 'l'],
                    },
                },
                required: ['character'],
            },
        },
        // Multi-session tools
        {
            name: 'list_terminal_sessions',
            description: 'List all available iTerm2 sessions with their metadata',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'create_session',
            description: 'Create a new iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Optional name for the session',
                    },
                    profile: {
                        type: 'string',
                        description: 'iTerm profile to use (default: "Default")',
                        default: 'Default',
                    },
                },
            },
        },
        {
            name: 'switch_session',
            description: 'Switch to a specific iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to switch to',
                    },
                },
                required: ['sessionId'],
            },
        },
        // Session-targeted tools
        {
            name: 'write_to_session',
            description: 'Write text to a specific iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to write to',
                    },
                    text: {
                        type: 'string',
                        description: 'The text or command to write',
                    },
                },
                required: ['sessionId', 'text'],
            },
        },
        {
            name: 'read_session_output',
            description: 'Read output from a specific iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to read from',
                    },
                    lines: {
                        type: 'number',
                        description: 'Number of lines to read (default: 50)',
                        default: 50,
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'send_control_to_session',
            description: 'Send control character to a specific iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session',
                    },
                    character: {
                        type: 'string',
                        description: 'Control character to send',
                        enum: ['c', 'd', 'z', 'l'],
                    },
                },
                required: ['sessionId', 'character'],
            },
        },
        {
            name: 'set_session_working_directory',
            description: 'Set the working directory for a specific session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session',
                    },
                    directory: {
                        type: 'string',
                        description: 'Directory path to set',
                    },
                },
                required: ['sessionId', 'directory'],
            },
        },
        {
            name: 'close_session',
            description: 'Close a specific iTerm2 session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to close',
                    },
                },
                required: ['sessionId'],
            },
        },
        // Monitoring tools
        {
            name: 'monitor_all_sessions',
            description: 'Monitor all iTerm2 sessions and return their states',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        // Claude Code integration tools
        {
            name: 'prompt_claude_code',
            description: 'Send a prompt to Claude Code in a specific session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session with Claude Code',
                    },
                    prompt: {
                        type: 'string',
                        description: 'The prompt to send to Claude Code',
                    },
                },
                required: ['sessionId', 'prompt'],
            },
        },
        {
            name: 'distribute_task',
            description: 'Distribute a complex task across multiple Claude Code sessions',
            inputSchema: {
                type: 'object',
                properties: {
                    mainPrompt: {
                        type: 'string',
                        description: 'The main task description',
                    },
                    subtasks: {
                        type: 'array',
                        description: 'Array of subtask prompts to distribute',
                        items: {
                            type: 'string',
                        },
                    },
                },
                required: ['mainPrompt', 'subtasks'],
            },
        },
        // Progress aggregation tools
        {
            name: 'create_progress_aggregation',
            description: 'Create a new progress aggregation for tracking multiple session outputs',
            inputSchema: {
                type: 'object',
                properties: {
                    mainTaskId: {
                        type: 'string',
                        description: 'ID of the main task being tracked',
                    },
                    sessionIds: {
                        type: 'array',
                        description: 'Array of session IDs to track',
                        items: {
                            type: 'string',
                        },
                    },
                },
                required: ['mainTaskId', 'sessionIds'],
            },
        },
        {
            name: 'update_aggregation_progress',
            description: 'Update progress for a specific session in an aggregation',
            inputSchema: {
                type: 'object',
                properties: {
                    aggregationId: {
                        type: 'string',
                        description: 'ID of the aggregation',
                    },
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to update',
                    },
                    status: {
                        type: 'string',
                        description: 'New status for the session',
                        enum: ['pending', 'in-progress', 'completed', 'failed'],
                    },
                    output: {
                        type: 'string',
                        description: 'Optional output to add',
                    },
                    error: {
                        type: 'string',
                        description: 'Optional error message',
                    },
                },
                required: ['aggregationId', 'sessionId'],
            },
        },
        {
            name: 'get_aggregated_progress',
            description: 'Get the current aggregated progress and synthesized results',
            inputSchema: {
                type: 'object',
                properties: {
                    aggregationId: {
                        type: 'string',
                        description: 'ID of the aggregation',
                    },
                },
                required: ['aggregationId'],
            },
        },
        {
            name: 'synthesize_results',
            description: 'Synthesize and summarize results from all sessions in an aggregation',
            inputSchema: {
                type: 'object',
                properties: {
                    aggregationId: {
                        type: 'string',
                        description: 'ID of the aggregation',
                    },
                },
                required: ['aggregationId'],
            },
        },
        // Error recovery tools
        {
            name: 'check_session_health',
            description: 'Check the health status of a specific session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session to check',
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'get_unhealthy_sessions',
            description: 'Get a list of all unhealthy or failing sessions',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'execute_with_retry',
            description: 'Execute a command with automatic retry on failure',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session',
                    },
                    command: {
                        type: 'string',
                        description: 'Command to execute',
                    },
                    errorType: {
                        type: 'string',
                        description: 'Expected error type',
                        enum: ['timeout', 'crash', 'network', 'command_failed', 'session_lost'],
                        default: 'command_failed',
                    },
                },
                required: ['sessionId', 'command'],
            },
        },
        // Safety tier tools
        {
            name: 'set_session_safety_tier',
            description: 'Set the safety tier for a session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session',
                    },
                    tier: {
                        type: 'string',
                        description: 'Safety tier to set',
                        enum: ['tier1', 'tier2', 'tier3'],
                    },
                },
                required: ['sessionId', 'tier'],
            },
        },
        {
            name: 'execute_with_safety',
            description: 'Execute a command with safety checks',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session',
                    },
                    command: {
                        type: 'string',
                        description: 'Command to execute',
                    },
                    approvalId: {
                        type: 'string',
                        description: 'Optional approval ID for tier 2/3 commands',
                    },
                },
                required: ['sessionId', 'command'],
            },
        },
        {
            name: 'approve_command',
            description: 'Approve a pending command for execution',
            inputSchema: {
                type: 'object',
                properties: {
                    approvalId: {
                        type: 'string',
                        description: 'ID of the approval request',
                    },
                    approvedBy: {
                        type: 'string',
                        description: 'Name of the approver',
                    },
                },
                required: ['approvalId', 'approvedBy'],
            },
        },
        {
            name: 'get_pending_approvals',
            description: 'Get list of commands pending approval',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'get_safety_violations',
            description: 'Get recent safety violations',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'Optional session ID to filter by',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of violations to return',
                        default: 100,
                    },
                },
            },
        },
        // Performance monitoring tools
        {
            name: 'get_performance_report',
            description: 'Get comprehensive performance report for all sessions',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        {
            name: 'get_session_performance',
            description: 'Get performance metrics for a specific session',
            inputSchema: {
                type: 'object',
                properties: {
                    sessionId: {
                        type: 'string',
                        description: 'ID of the session',
                    },
                    historyLimit: {
                        type: 'number',
                        description: 'Number of historical metrics to return',
                        default: 10,
                    },
                },
                required: ['sessionId'],
            },
        },
        {
            name: 'get_performance_alerts',
            description: 'Get recent performance alerts',
            inputSchema: {
                type: 'object',
                properties: {
                    severity: {
                        type: 'string',
                        description: 'Filter by alert severity',
                        enum: ['low', 'medium', 'high', 'critical'],
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of alerts to return',
                        default: 50,
                    },
                },
            },
        },
        {
            name: 'get_optimization_suggestions',
            description: 'Get performance optimization suggestions',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        },
        // Validation tools
        {
            name: 'run_walt_opie_validation',
            description: 'Run comprehensive Walt Opie project validation test',
            inputSchema: {
                type: 'object',
                properties: {
                    testType: {
                        type: 'string',
                        description: 'Type of validation test to run',
                        enum: ['full', 'quick'],
                        default: 'quick',
                    },
                },
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'write_to_terminal': {
            const { text } = args;
            console.error('[MCP Handler] write_to_terminal called with args:', args);
            // Validate the text parameter
            if (text === undefined || text === null) {
                console.error('[MCP Handler] ERROR: text parameter is missing or null');
                throw new Error('Text parameter is required for write_to_terminal');
            }
            await commandExecutor.writeToTerminal(text);
            return { content: [{ type: 'text', text: 'Text written to terminal' }] };
        }
        case 'read_terminal_output': {
            const { lines } = args;
            const output = await commandExecutor.readTerminalOutput(lines);
            return { content: [{ type: 'text', text: output }] };
        }
        case 'send_control_character': {
            const { character } = args;
            await commandExecutor.sendControlCharacter(character);
            return { content: [{ type: 'text', text: `Sent Ctrl-${character.toUpperCase()}` }] };
        }
        case 'list_terminal_sessions': {
            const sessions = await sessionManager.enumerateSessions();
            const sessionList = sessions.map(s => ({
                id: s.id,
                name: s.name,
                state: s.state,
                windowId: s.windowId,
                tabId: s.tabId,
                workingDirectory: s.context.workingDirectory,
            }));
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(sessionList, null, 2)
                    }]
            };
        }
        case 'create_session': {
            const { name, profile } = args;
            const session = await sessionManager.createSession(name, profile);
            return {
                content: [{
                        type: 'text',
                        text: `Created session: ${session.id} (${session.name})`
                    }]
            };
        }
        case 'switch_session': {
            const { sessionId } = args;
            await sessionManager.switchToSession(sessionId);
            return {
                content: [{
                        type: 'text',
                        text: `Switched to session: ${sessionId}`
                    }]
            };
        }
        case 'write_to_session': {
            const { sessionId, text } = args;
            console.error('[MCP Handler] write_to_session called with args:', args);
            // Validate parameters
            if (!sessionId) {
                throw new Error('Session ID is required for write_to_session');
            }
            if (text === undefined || text === null) {
                console.error('[MCP Handler] ERROR: text parameter is missing or null');
                throw new Error('Text parameter is required for write_to_session');
            }
            await commandExecutor.writeToSession(sessionId, text);
            return {
                content: [{
                        type: 'text',
                        text: `Text written to session: ${sessionId}`
                    }]
            };
        }
        case 'read_session_output': {
            const { sessionId, lines } = args;
            const output = await commandExecutor.readSessionOutput(sessionId, lines);
            return {
                content: [{
                        type: 'text',
                        text: output
                    }]
            };
        }
        case 'send_control_to_session': {
            const { sessionId, character } = args;
            await commandExecutor.sendControlToSession(sessionId, character);
            return {
                content: [{
                        type: 'text',
                        text: `Sent Ctrl-${character.toUpperCase()} to session: ${sessionId}`
                    }]
            };
        }
        case 'set_session_working_directory': {
            const { sessionId, directory } = args;
            await sessionManager.setSessionWorkingDirectory(sessionId, directory);
            return {
                content: [{
                        type: 'text',
                        text: `Set working directory for session ${sessionId} to: ${directory}`
                    }]
            };
        }
        case 'close_session': {
            const { sessionId } = args;
            await sessionManager.closeSession(sessionId);
            return {
                content: [{
                        type: 'text',
                        text: `Closed session: ${sessionId}`
                    }]
            };
        }
        case 'monitor_all_sessions': {
            const states = await processTracker.monitorAllSessions();
            const output = states.map(s => ({
                sessionId: s.sessionId,
                isProcessing: s.isProcessing,
                tty: s.tty,
                processCount: s.processes.length,
                mainProcess: s.processes[0]?.command || 'none',
                cpuUsage: s.processes.reduce((sum, p) => sum + p.cpu, 0).toFixed(1) + '%',
                memoryUsage: s.processes.reduce((sum, p) => sum + p.memory, 0).toFixed(1) + '%'
            }));
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(output, null, 2)
                    }]
            };
        }
        case 'prompt_claude_code': {
            const { sessionId, prompt } = args;
            try {
                const response = await claudeIntegration.promptClaudeCode(sessionId, prompt);
                return {
                    content: [{
                            type: 'text',
                            text: response
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error prompting Claude Code: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        case 'distribute_task': {
            const { mainPrompt, subtasks } = args;
            try {
                const result = await taskDistributor.distributeTask(mainPrompt, subtasks);
                const summary = {
                    taskId: result.id,
                    status: result.status,
                    subtaskCount: result.subtasks.length,
                    completedCount: result.subtasks.filter(s => s.status === 'completed').length,
                    results: result.results ? Object.fromEntries(result.results) : {}
                };
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(summary, null, 2)
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error distributing task: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        case 'create_progress_aggregation': {
            const { mainTaskId, sessionIds } = args;
            const aggregationId = progressAggregator.createAggregation(mainTaskId, sessionIds);
            return {
                content: [{
                        type: 'text',
                        text: `Created progress aggregation: ${aggregationId}`
                    }]
            };
        }
        case 'update_aggregation_progress': {
            const { aggregationId, sessionId, status, output, error } = args;
            try {
                if (status) {
                    progressAggregator.updateProgress(aggregationId, sessionId, { status });
                }
                if (output) {
                    progressAggregator.addOutput(aggregationId, sessionId, output);
                }
                if (error) {
                    progressAggregator.updateProgress(aggregationId, sessionId, { error });
                }
                return {
                    content: [{
                            type: 'text',
                            text: 'Progress updated successfully'
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error updating progress: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        case 'get_aggregated_progress': {
            const { aggregationId } = args;
            const progress = progressAggregator.getProgress(aggregationId);
            if (!progress) {
                return {
                    content: [{
                            type: 'text',
                            text: `Aggregation ${aggregationId} not found`
                        }]
                };
            }
            const summary = {
                id: progress.id,
                mainTaskId: progress.mainTaskId,
                overallStatus: progress.overallStatus,
                isComplete: progressAggregator.isComplete(aggregationId),
                subtaskStatuses: Array.from(progress.subtasks.entries()).map(([sessionId, task]) => ({
                    sessionId,
                    status: task.status,
                    hasOutput: task.output.length > 0,
                    hasError: !!task.error
                }))
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(summary, null, 2)
                    }]
            };
        }
        case 'synthesize_results': {
            const { aggregationId } = args;
            try {
                const synthesized = progressAggregator.synthesizeResults(aggregationId);
                await progressAggregator.generateSummary(aggregationId);
                return {
                    content: [{
                            type: 'text',
                            text: synthesized
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error synthesizing results: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        case 'check_session_health': {
            const { sessionId } = args;
            try {
                const isHealthy = await errorRecovery.checkSessionHealth(sessionId);
                const health = errorRecovery.getSessionHealth(sessionId);
                const result = {
                    sessionId,
                    isHealthy,
                    lastCheck: health?.lastCheck,
                    consecutiveFailures: health?.consecutiveFailures || 0,
                    recentErrors: health?.errors.slice(-5) || []
                };
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error checking session health: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        case 'get_unhealthy_sessions': {
            const unhealthySessions = errorRecovery.getUnhealthySessions();
            const summary = unhealthySessions.map(health => ({
                sessionId: health.sessionId,
                isHealthy: health.isHealthy,
                consecutiveFailures: health.consecutiveFailures,
                lastError: health.errors[health.errors.length - 1],
                errorCount: health.errors.length
            }));
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(summary, null, 2)
                    }]
            };
        }
        case 'execute_with_retry': {
            const { sessionId, command, errorType } = args;
            try {
                await errorRecovery.executeWithRetry(sessionId, async () => {
                    await commandExecutor.writeToSession(sessionId, command);
                    // Wait a bit for command to execute
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return await commandExecutor.readSessionOutput(sessionId, 10);
                }, errorType || 'command_failed');
                return {
                    content: [{
                            type: 'text',
                            text: 'Command executed successfully with retry support'
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Command failed after retries: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        case 'set_session_safety_tier': {
            const { sessionId, tier } = args;
            safetyTiers.setSessionSafetyTier(sessionId, tier);
            return {
                content: [{
                        type: 'text',
                        text: `Session ${sessionId} safety tier set to ${tier}`
                    }]
            };
        }
        case 'execute_with_safety': {
            const { sessionId, command, approvalId } = args;
            const result = await safetyTiers.executeWithSafety(sessionId, command, approvalId);
            if (result.success) {
                return {
                    content: [{
                            type: 'text',
                            text: result.output || 'Command executed successfully'
                        }]
                };
            }
            else {
                return {
                    content: [{
                            type: 'text',
                            text: `Safety check failed: ${result.error}`
                        }]
                };
            }
        }
        case 'approve_command': {
            const { approvalId, approvedBy } = args;
            const approved = safetyTiers.approveCommand(approvalId, approvedBy);
            return {
                content: [{
                        type: 'text',
                        text: approved ? 'Command approved successfully' : 'Approval ID not found'
                    }]
            };
        }
        case 'get_pending_approvals': {
            const approvals = safetyTiers.getPendingApprovals();
            const summary = approvals.map(a => ({
                id: a.id,
                sessionId: a.sessionId,
                command: a.command,
                tier: a.tier,
                timestamp: a.timestamp
            }));
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(summary, null, 2)
                    }]
            };
        }
        case 'get_safety_violations': {
            const { sessionId, limit } = args;
            const violations = safetyTiers.getViolations(sessionId, limit);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(violations, null, 2)
                    }]
            };
        }
        case 'get_performance_report': {
            const report = performanceMonitor.getPerformanceReport();
            const formattedReport = {
                systemMetrics: report.system,
                sessionCount: report.sessions.size,
                healthStatus: report.health,
                recentAlerts: report.recentAlerts,
                topSessions: Array.from(report.sessions.entries())
                    .filter(([_, metrics]) => metrics)
                    .sort(([_, a], [__, b]) => (b?.cpuUsage || 0) - (a?.cpuUsage || 0))
                    .slice(0, 5)
                    .map(([sessionId, metrics]) => ({ sessionId, ...metrics }))
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(formattedReport, null, 2)
                    }]
            };
        }
        case 'get_session_performance': {
            const { sessionId, historyLimit } = args;
            const currentMetrics = performanceMonitor.getSessionMetrics(sessionId);
            const history = performanceMonitor.getSessionMetricsHistory(sessionId, historyLimit);
            const result = {
                current: currentMetrics,
                history: history.slice(-10), // Last 10 entries for display
                trends: {
                    cpuTrend: calculateTrend(history.map(h => h.cpuUsage)),
                    memoryTrend: calculateTrend(history.map(h => h.memoryUsage)),
                    responseTimeTrend: calculateTrend(history.map(h => h.responseTime))
                }
            };
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(result, null, 2)
                    }]
            };
        }
        case 'get_performance_alerts': {
            const { severity, limit } = args;
            const alerts = performanceMonitor.getAlerts(severity, limit);
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify(alerts, null, 2)
                    }]
            };
        }
        case 'get_optimization_suggestions': {
            const suggestions = performanceMonitor.getOptimizationSuggestions();
            return {
                content: [{
                        type: 'text',
                        text: JSON.stringify({ suggestions }, null, 2)
                    }]
            };
        }
        case 'run_walt_opie_validation': {
            const { testType } = args;
            try {
                let result;
                if (testType === 'full') {
                    result = await waltOpieValidation.runValidationTest();
                }
                else {
                    result = await waltOpieValidation.runQuickValidationTest();
                }
                return {
                    content: [{
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }]
                };
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Validation test failed: ${error instanceof Error ? error.message : String(error)}`
                        }]
                };
            }
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
// Helper function to calculate trend
function calculateTrend(values) {
    if (values.length < 2)
        return 'stable';
    const recent = values.slice(-3);
    const older = values.slice(-6, -3);
    if (recent.length === 0 || older.length === 0)
        return 'stable';
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
    const change = (recentAvg - olderAvg) / olderAvg;
    if (change > 0.1)
        return 'increasing';
    if (change < -0.1)
        return 'decreasing';
    return 'stable';
}
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Enhanced iTerm MCP server running...');
// Cleanup on shutdown
process.on('SIGINT', () => {
    errorRecovery.stopHealthMonitoring();
    performanceMonitor.stopMonitoring();
    process.exit(0);
});
process.on('SIGTERM', () => {
    errorRecovery.stopHealthMonitoring();
    performanceMonitor.stopMonitoring();
    process.exit(0);
});
//# sourceMappingURL=index.js.map