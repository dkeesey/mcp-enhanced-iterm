# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the Enhanced iTerm MCP project.

## Project Overview
Enhanced iTerm MCP is a Model Context Protocol server that extends iTerm2 integration for Claude Desktop. It enables powerful multi-session terminal orchestration, allowing Claude to manage multiple terminal sessions, coordinate multiple Claude Code instances, and distribute complex tasks across parallel AI agents.

## Commands

### Build and Development
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Development mode (watch for changes)
npm run dev

# Quick install (automated setup)
./install.sh
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test src/core/SessionManager.test.ts
```

### Linting and Type Checking
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Type check without building
npm run type-check
```

### Task Management
```bash
# List all tasks
npm run tasks

# Get next task to work on
npm run next

# View task dashboard
npm run dashboard

# Expand a complex task
npm run expand -- --id=<task-id>

# Mark task complete
npm run complete -- --id=<task-id>
```

## Architecture

### Core Components
- **SessionManager** (`src/core/SessionManager.ts`) - Manages iTerm2 sessions via AppleScript
- **CommandExecutor** (`src/core/CommandExecutor.ts`) - Executes commands in terminal sessions
- **TaskDistributor** (`src/features/TaskDistributor.ts`) - Distributes tasks across Claude instances
- **SafetyTiers** (`src/features/SafetyTiers.ts`) - Three-tier command approval system
- **PerformanceMonitor** (`src/features/PerformanceMonitor.ts`) - Real-time performance tracking
- **ErrorRecovery** (`src/features/ErrorRecovery.ts`) - Automatic retry and health monitoring

### MCP Tools (32 total)
The server provides tools organized into categories:
- **Session Management** (8 tools) - create, switch, list, close sessions
- **Task Distribution** (4 tools) - distribute work across Claude instances
- **Progress Tracking** (4 tools) - monitor and aggregate results
- **Safety Controls** (6 tools) - approve/reject commands based on risk
- **Performance Monitoring** (4 tools) - track CPU, memory, response times
- **Error Recovery** (5 tools) - health checks and automatic retries
- **Validation** (1 tool) - system health testing

### Key Technologies
- TypeScript (ES2022 modules)
- Model Context Protocol SDK
- AppleScript integration for iTerm2 control
- Vitest for testing
- UUID generation for unique identifiers

## Development Workflow

### Working with the Code
1. This is a TypeScript project using ES modules
2. All source code is in `src/` directory
3. Build output goes to `dist/` directory
4. Tests are co-located with source files (*.test.ts)

### Testing Strategy
- Unit tests for individual components
- Integration tests for MCP server functionality
- Mock AppleScript commands during testing
- Test coverage for all public methods

### Claude Desktop Integration
The server integrates with Claude Desktop via the MCP configuration:
```json
{
  "mcpServers": {
    "enhanced-iterm-mcp": {
      "command": "node",
      "args": ["/path/to/enhanced-iterm-mcp/dist/index.js"],
      "env": {
        "SAFETY_TIER": "review",
        "MAX_SESSIONS": "10",
        "DEFAULT_TIMEOUT": "30000"
      }
    }
  }
}
```

## Important Notes

### Safety Considerations
- Three-tier safety system: review (default), ask, yolo
- Commands are validated before execution
- Dangerous commands require explicit approval
- Session limits prevent resource exhaustion

### Performance Guidelines
- Monitor memory usage with performance tools
- Sessions are automatically cleaned up on errors
- Health checks run periodically
- Response times are tracked for optimization

### Error Handling
- Automatic retry for transient failures
- Health monitoring for all sessions
- Graceful degradation when sessions fail
- Detailed error logging for debugging

## Common Tasks

### Adding a New Tool
1. Define the tool in `src/tools/`
2. Register it in the MCP server
3. Add tests for the new functionality
4. Update API documentation

### Debugging Session Issues
1. Check session list with appropriate tool
2. Verify AppleScript permissions
3. Review error logs for command failures
4. Use health check tools for diagnostics

### Updating Dependencies
```bash
# Update all dependencies
npm update

# Update specific dependency
npm install @modelcontextprotocol/sdk@latest

# Check for outdated packages
npm outdated
```

## Environment Variables
```bash
# Safety tier (review/ask/yolo)
SAFETY_TIER=review

# Maximum concurrent sessions
MAX_SESSIONS=10

# Command timeout in milliseconds
DEFAULT_TIMEOUT=30000

# Enable debug logging
DEBUG=true

# Performance monitoring interval
MONITOR_INTERVAL=5000
```