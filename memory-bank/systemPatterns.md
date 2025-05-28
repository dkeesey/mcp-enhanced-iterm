# System Patterns

## Architecture Decisions

### Integrated Project Initialization Architecture
**Decision**: Combine memory bank and TaskMaster integration into a single initialization process
**Rationale**: Eliminates the friction of setting up projects with both systems, ensures consistency, and provides immediate structured development capability
**Implementation**: `initialize_project_integrated.sh` with selective options (--memory-only, --taskmaster-only, or full integration)

### TaskMaster Integration Pattern
**Decision**: TaskMaster becomes the primary task management system while memory bank provides persistent context
**Rationale**: TaskMaster provides structured development workflow, Git integration, and AI-assisted task breakdown, while memory bank preserves architectural decisions and learning
**Implementation**: Combined system where TaskMaster tracks immediate work and memory bank captures long-term context

### Memory + TaskMaster Synchronization
**Decision**: Memory bank activeContext.md reflects current TaskMaster status and task focus
**Rationale**: Ensures Claude has both structured task context and broader project understanding when starting conversations
**Implementation**: activeContext.md includes TaskMaster status, current task details, and project progression

## Design Patterns

### Startup Protocol Integration
**Pattern**: Claude automatically provides project status combining memory index and TaskMaster dashboard
**Implementation**: 
- Read memory_index.md for active projects
- Query SQLite database for priority tasks
- Present unified status with available commands
- Guide user to appropriate workflow (memory, TaskMaster, or integrated)

### Project Creation Workflow
**Pattern**: Single command creates complete development environment
**Implementation**:
1. TaskMaster structure (package.json, .env, Git hooks, Cursor rules)
2. Memory bank structure (projectbrief.md, productContext.md, etc.)
3. Project-specific customization (PRD template, task structure)
4. Integration verification and guidance

### Development Workflow Pattern
**Pattern**: Task-driven development with memory preservation
**Implementation**:
- TaskMaster dashboard → next task → branch creation → implementation
- Git commits with "Task-X" format trigger automatic completion
- Memory bank updates capture architectural decisions and learnings
- Cursor AI has access to both task context and project memory

## Data Flow

### Project Information Flow
```
PRD → TaskMaster tasks.json → Individual task implementation → Git commits → Memory bank updates
     ↓                                                                              ↑
Memory Index ← Project Memory Bank ← Active Context ← TaskMaster Status ← Progress Tracking
```

### Claude Conversation Flow
```
Session Start → Memory Index + SQLite Query → Project Status Summary → Available Commands
                                                        ↓
User Request → TaskMaster Commands OR Memory Commands OR Project Creation
                                                        ↓
Action Execution → Progress Tracking → Memory Updates → Next Session Context
```

## Security Patterns

### API Key Management
**Pattern**: Environment-based configuration with template files
**Implementation**: .env.template with placeholder values, .env in .gitignore, clear documentation for setup

### Git Integration Safety
**Pattern**: Automatic task completion through commit message parsing
**Implementation**: Git hooks that parse "Task-X" format and call TaskMaster set-status, with error handling for failures

### Tool Access Control
**Pattern**: MCP server prioritization with fallback behavior
**Implementation**: Filesystem MCP (highest priority) → iTerm MCP → SQLite MCP, with graceful degradation when tools unavailable

## Error Handling

### Integration Failure Recovery
**Pattern**: Partial success with clear guidance for completion
**Implementation**: Each integration step can succeed independently, failures provide specific remediation steps

### TaskMaster API Issues
**Pattern**: Graceful degradation to manual task management
**Implementation**: When TaskMaster commands fail, provide manual alternatives and troubleshooting steps

### Memory System Resilience
**Pattern**: Tiered information availability with fallbacks
**Implementation**: System prompt info → Memory index → Project memory → SQLite database, continue with available information

## Testing Strategy

### Integration Validation
**Pattern**: Comprehensive verification of all integration components
**Implementation**: verify-taskmaster.sh script that checks:
- Project structure completeness
- TaskMaster functionality
- Git integration
- Memory bank consistency
- Development workflow readiness

### Real-World Validation
**Pattern**: Use actual client projects as integration test cases
**Implementation**: Enhanced iTerm MCP project serves as validation of the integrated system's effectiveness

## Performance Patterns

### Startup Optimization
**Pattern**: Fast session startup with comprehensive context
**Implementation**: Pre-computed project summaries, efficient database queries, lazy loading of detailed context

### Development Workflow Efficiency
**Pattern**: Minimal context switching between tools and systems
**Implementation**: Unified command interface, automatic progress tracking, integrated development environment

## TaskMaster Integration Patterns

### Task Definition Structure
**Pattern**: Hierarchical task breakdown with clear dependencies
**Implementation**: Main tasks with subtasks, dependency tracking, complexity analysis, clear completion criteria

### Progress Tracking Integration
**Pattern**: Git workflow drives task completion automatically
**Implementation**: Commit message parsing triggers TaskMaster status updates, maintains development flow without manual tracking

### AI-Assisted Development
**Pattern**: TaskMaster context available to AI assistants (Claude, Cursor)
**Implementation**: .cursor/rules/ integration, memory bank cross-references, task-specific guidance

## Learned Optimizations

### Template System Efficiency
**Learning**: Centralized templates with project-specific customization is more maintainable than project-specific templates
**Implementation**: Single template directory with variable substitution for project names and paths

### Command Interface Design
**Learning**: Unified command interface reduces cognitive load and improves adoption
**Implementation**: Both npm run shortcuts and full TaskMaster commands available, consistent command patterns

### Documentation Integration
**Learning**: Documentation must be immediately available and contextually relevant
**Implementation**: Memory bank provides persistent context, TaskMaster provides current focus, integration summary available at project level

These patterns ensure the integrated system provides both immediate productivity and long-term project context preservation, supporting both individual development work and collaborative project understanding.
