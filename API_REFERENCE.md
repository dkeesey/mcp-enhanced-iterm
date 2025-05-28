# Enhanced iTerm MCP - API Reference

This document provides a quick reference for the Enhanced iTerm MCP tools.

## Session Management Tools

### `list_terminal_sessions`
Lists all available iTerm2 sessions with metadata.

### `create_session`
Creates a new iTerm2 session.
- `name` (optional): Session name
- `profile` (optional): iTerm profile to use

### `switch_session`
Switches to a specific session.
- `sessionId`: Target session ID

### `close_session` 
Closes a specific session.
- `sessionId`: Session ID to close

## Command Execution Tools

### `write_to_session`
Writes text/commands to a specific session.
- `sessionId`: Target session
- `text`: Command or text to write

### `read_session_output`
Reads output from a specific session.
- `sessionId`: Target session
- `lines` (optional): Number of lines to read

### `execute_with_safety`
Executes commands with safety checks.
- `sessionId`: Target session
- `command`: Command to execute
- `approvalId` (optional): Approval ID for restricted commands

## Task Distribution Tools

### `distribute_task`
Distributes complex tasks across multiple sessions.
- `mainPrompt`: Main task description
- `subtasks`: Array of subtask prompts

### `create_progress_aggregation`
Creates progress tracker for multiple sessions.
- `mainTaskId`: ID of main task
- `sessionIds`: Array of session IDs to track

### `synthesize_results`
Synthesizes results from multiple sessions.
- `aggregationId`: Aggregation tracker ID

## Safety & Monitoring Tools

### `set_session_safety_tier`
Sets safety tier for a session.
- `sessionId`: Target session
- `tier`: Safety tier (tier1/tier2/tier3)

### `get_performance_report`
Gets comprehensive performance report for all sessions.

### `check_session_health`
Checks health status of a specific session.
- `sessionId`: Target session

### `execute_with_retry`
Executes commands with automatic retry on failure.
- `sessionId`: Target session
- `command`: Command to execute
- `errorType` (optional): Expected error type

## Validation Tools

### `run_walt_opie_validation`
Runs validation test using Walt Opie project simulation.
- `testType` (optional): 'full' or 'quick' test

## Core Capabilities

1. **Multi-Session Management**: Create, manage, and coordinate multiple iTerm2 sessions
2. **Task Distribution**: Split complex tasks across multiple Claude Code instances
3. **Progress Aggregation**: Combine outputs from multiple sessions into coherent results
4. **Safety Tiers**: Three-tier safety system (full autonomy, supervised, manual control)
5. **Error Recovery**: Automatic retry logic and graceful degradation
6. **Performance Monitoring**: Real-time resource usage and performance tracking
7. **Validation Framework**: Real-world testing capabilities

## Usage Example

```typescript
// Create multiple analysis sessions
const sessions = await Promise.all([
  createSession('financial-analysis'),
  createSession('market-research'),
  createSession('risk-assessment')
]);

// Set safety tiers
sessions.forEach(session => 
  setSessionSafetyTier(session.id, 'tier2')
);

// Distribute analysis tasks
const result = await distributeTask(
  'Comprehensive business analysis',
  [
    'Analyze financial metrics',
    'Research market conditions', 
    'Assess operational risks'
  ]
);

// Monitor progress and aggregate results
const aggregationId = createProgressAggregation(result.id, sessions.map(s => s.id));
const finalResults = await synthesizeResults(aggregationId);
```