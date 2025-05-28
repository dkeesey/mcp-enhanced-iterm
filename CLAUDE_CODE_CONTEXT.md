# Enhanced iTerm MCP - Claude Code Context Primer

## Project Overview
**Goal**: Develop advanced iTerm MCP server for multi-session management and Claude Code orchestration
**Business Value**: 3-5x faster completion, 90% error reduction, 80% autonomy for complex projects
**Current Status**: Task #1 ready for implementation (Project Setup and Foundation)

## Current Task Focus
**Task #1: Project Setup and Foundation**
- **Priority**: High
- **Status**: Pending (ready to start)
- **Dependencies**: None
- **Description**: Initialize TypeScript project with MCP SDK, testing framework, development tools
- **Success Criteria**: Project builds, tests run, existing iTerm MCP compatibility maintained
- **Details**: Set up TypeScript project with MCP SDK, establish testing framework, configure development tools, and ensure backward compatibility with existing iTerm MCP

## TaskMaster Workflow Commands
```bash
# Essential commands for this project
npm run dashboard              # Check overall progress
npm run next                  # See next available task  
npm run tasks                 # List all tasks
npx task-master show 1        # View Task #1 details
npx task-master show <id>     # View any task details

# When starting work on a task
npx task-master set-status --id=1 --status=in-progress

# When completing a task
git commit -m "Complete project setup - Task-1"  # Auto-completes task
```

## Project Structure
```
enhanced-iterm-mcp/
├── memory-bank/              # Project memory and context
│   ├── projectbrief.md      # Core project definition
│   ├── productContext.md   # Problem statement and value
│   ├── systemPatterns.md   # Architecture decisions  
│   ├── techContext.md      # Technology stack and setup
│   ├── activeContext.md    # Current focus and challenges
│   └── progress.md         # Progress tracking and metrics
├── scripts/
│   └── prd.txt             # Detailed project requirements
├── tasks/                  # TaskMaster task files
├── .cursor/rules/          # Development guidelines
├── package.json           # ES modules + TaskMaster integration
├── WORKFLOW.md            # Development workflow guide
└── tasks.json             # TaskMaster task definitions (15 tasks)
```

## Technical Context
- **Language**: TypeScript/JavaScript (ES modules)
- **Framework**: Model Context Protocol (MCP) standard
- **Platform**: macOS (iTerm2 integration via AppleScript)
- **Foundation**: Extend existing iTerm MCP (don't rebuild from scratch)
- **Testing**: Real-world validation with Walt Opie project

## Architecture Approach
- **Backward Compatibility**: 100% compatible with existing iTerm MCP
- **API Extensions**: Add new methods while preserving existing ones
- **Safety Tiers**: Tier 1 (full autonomy) → Tier 2 (supervised) → Tier 3 (manual)
- **Performance Target**: <100ms response time, 10+ concurrent sessions

## Key Implementation Notes
- Research existing iTerm MCP before extending
- Use AppleScript APIs for iTerm session management  
- Implement proper error handling and session isolation
- Maintain MCP protocol compliance throughout

## Next Steps for Task #1
1. Set up TypeScript project structure
2. Install and configure MCP SDK
3. Set up testing framework (Jest recommended)
4. Configure build system and development tools
5. Verify backward compatibility with existing iTerm MCP
6. Create initial test suite

## Completion Criteria for Task #1
- ✅ Project builds without errors
- ✅ Test suite runs successfully  
- ✅ MCP SDK integration functional
- ✅ Development workflow operational
- ✅ Existing iTerm MCP API compatibility maintained

## Important Files to Reference
- `scripts/prd.txt` - Complete requirements document
- `memory-bank/techContext.md` - Detailed technical requirements
- `memory-bank/systemPatterns.md` - Architecture decisions and patterns
- `tasks.json` - All 15 tasks with dependencies and details

## Git Workflow
- Create branch for Task #1: `git checkout -b task/1-project-setup`
- Commit with task ID: `git commit -m "Description - Task-1"`
- TaskMaster will automatically mark task complete on commit

This project represents a significant advancement in AI workflow automation, addressing CDT's single-threaded limitations while providing a foundation for systematic AI orchestration in professional services.
