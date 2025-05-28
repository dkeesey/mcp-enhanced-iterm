# MCP Integration Guide for Claude Code Access

## Overview
This guide explains how to give Claude Code instances access to project memory and TaskMaster through MCP servers.

## Required MCP Servers

### 1. Filesystem MCP (Essential)
```bash
# Provides access to project files
npx -y @modelcontextprotocol/server-filesystem
```
**Access to:**
- Project memory bank (`memory-bank/` directory)
- TaskMaster files (`tasks.json`, `tasks/` directory)
- Project configuration and documentation

### 2. SQLite MCP (Optional)
```bash  
# Provides access to task database
npx -y mcp-server-sqlite-npx
```
**Database**: `~/Workspace/tools/claude/memory/claude_memory.db`
**Access to:**
- Project metadata and relationships
- Task tracking and dependencies
- Session history and progress

### 3. Git MCP (Helpful)
```bash
# Provides Git operations
uvx mcp-server-git
```
**Access to:**
- Git status and history
- Branch management for tasks
- Commit operations with task ID integration

## Claude Code MCP Configuration

### Configuration File Location
Claude Code uses MCP configuration from:
```
~/.config/claude-code/mcp_servers.json
```

### Basic Configuration
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "~/Workspace,~/Documents"
      }
    },
    "sqlite": {
      "command": "npx", 
      "args": ["-y", "mcp-server-sqlite-npx"],
      "env": {
        "DATABASE_PATH": "~/Workspace/tools/claude/memory/claude_memory.db"
      }
    },
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git"]
    }
  }
}
```

## Claude Code Context Patterns

### 1. Project Context Loading
When starting Claude Code in a project directory:

```
I'm working on the Enhanced iTerm MCP project. Please read:
- memory-bank/projectbrief.md for project overview
- memory-bank/activeContext.md for current focus  
- tasks.json for current task status
- CLAUDE_CODE_CONTEXT.md for development context

What's our current task and how should we proceed?
```

### 2. Task-Specific Context
Before working on a specific task:

```
Please read task details for Task #1:
- Run: npx task-master show 1
- Review: memory-bank/techContext.md for technical requirements
- Check: any related documentation for this task

Let's plan our approach for implementing this task.
```

### 3. Progress Updates
After completing work:

```
I've completed work on Task #1. Please:
- Update memory-bank/activeContext.md with progress
- Record any architectural decisions in memory-bank/systemPatterns.md
- Prepare commit message with Task-1 format for automatic completion

What should we focus on next?
```

## Multi-Instance Coordination

### Shared Context Protocol
When running multiple Claude Code instances:

1. **Instance Assignment**: Assign each instance a specific task or aspect
2. **Shared State**: All instances read from same memory bank and TaskMaster files
3. **Progress Coordination**: Use Git branches to prevent conflicts
4. **Communication**: Update shared files for cross-instance communication

### Example Multi-Instance Setup
```bash
# Terminal 1: Instance for Task #1 (Project Setup)
cd ~/Workspace/tools/mcp/enhanced-iterm-mcp
git checkout -b task/1-project-setup
code .

# Terminal 2: Instance for Research (Task #2 prep)
cd ~/Workspace/tools/mcp/enhanced-iterm-mcp  
git checkout -b task/2-research-prep
code .

# Terminal 3: Instance for Documentation
cd ~/Workspace/tools/mcp/enhanced-iterm-mcp
git checkout -b documentation-updates
code .
```

## Benefits of MCP Integration

### For Claude Code
- **Complete Project Context**: Access to all project memory and task information
- **Real-Time Updates**: Can read current task status and progress
- **Git Integration**: Can commit with proper task ID format
- **Shared Knowledge**: Multiple instances can coordinate through shared files

### For Project Management  
- **Consistent Context**: All CC instances work with same project understanding
- **Progress Tracking**: TaskMaster automatically tracks completion through Git
- **Memory Preservation**: Architectural decisions captured in memory bank
- **Scalable Development**: Multiple CC instances can work in parallel

## Implementation Priority

### Immediate (Current Project)
1. **Direct File Access**: Claude Code working in project directory
2. **Context Primer**: Use CLAUDE_CODE_CONTEXT.md for quick onboarding
3. **TaskMaster Integration**: Use npm commands for task management

### Future Enhancement (Enhanced iTerm MCP Goal)
1. **MCP Server Integration**: Full MCP-based access to project systems
2. **Multi-Instance Coordination**: Systematic parallel CC workflows  
3. **Automated Context Loading**: CC instances auto-load project context
4. **Progress Orchestration**: Automated coordination between CC instances

This approach ensures Claude Code has comprehensive access to project context while maintaining the structured development workflow provided by TaskMaster and the persistent context provided by the memory bank system.
