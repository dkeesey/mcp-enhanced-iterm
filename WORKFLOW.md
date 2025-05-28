# Development Workflow

This project uses TaskMaster for structured, AI-assisted development. Follow this workflow for optimal productivity and progress tracking.

## Daily Startup Routine

```bash
# 1. Check overall progress and status
task-master dashboard

# 2. See what tasks are available to work on
task-master next

# 3. Create a branch for the selected task
task-master branch
```

## Task Implementation Workflow

### 1. Task Selection and Setup
- Use `task-master next` to identify the highest priority available task
- Review task details with `task-master show <id>`
- Create dedicated branch with `task-master branch`
- Review any task-specific memory context

### 2. Implementation
- Follow the task's implementation details and test strategy
- Consider dependencies and integration points
- Document architectural decisions in memory bank
- Break down complex tasks if needed with `task-master expand <id>`

### 3. Testing and Validation
- Implement tests according to the task's testStrategy
- Verify all acceptance criteria are met
- Ensure no regressions in existing functionality

### 4. Completion
- Commit changes with proper format: "Description - Task-X"
- Verify automatic task completion
- Update memory bank with any learnings or decisions
- Move to next available task

## TaskMaster Commands Reference

### Core Commands
```bash
task-master list                    # List all tasks
task-master next                    # Show next available task
task-master show <id>              # Show task details
task-master dashboard              # View progress overview
task-master branch                 # Create task branch
```

### Task Management
```bash
task-master set-status --id=<id> --status=<status>  # Update task status
task-master expand --id=<id>                        # Break down complex tasks
task-master analyze-complexity                      # Analyze all task complexity
task-master complexity-report                       # View complexity analysis
```

### PRD and Setup
```bash
task-master parse-prd scripts/prd.txt              # Generate tasks from PRD
task-master generate                                # Create individual task files
```

## Git Integration

### Commit Message Format
Always include the task ID in your commit messages for automatic completion:

```bash
# Good examples:
git commit -m "Implement user authentication - Task-3"
git commit -m "Add database schema migration - Task-7"
git commit -m "Fix responsive layout bug - Task-12"

# Bad examples (won't trigger automatic completion):
git commit -m "Fix bug"
git commit -m "Add feature"
```

### Branch Naming
Use `task-master branch` for consistent naming:
- Format: `task/<id>-<description>`
- Example: `task/3-user-authentication`

## Cursor AI Integration

The project includes Cursor rules that provide AI context about:
- TaskMaster commands and workflow
- Current task context and requirements
- Memory bank information and patterns
- Git workflow and commit formatting

## Memory Management

### Memory Bank Structure
- `projectbrief.md` - Core project definition
- `productContext.md` - Problem and value proposition
- `systemPatterns.md` - Architecture and design patterns
- `techContext.md` - Technology stack and setup
- `activeContext.md` - Current work and decisions
- `progress.md` - Progress tracking and metrics
- `project_rules.md` - Project-specific patterns

### Memory Updates
Update memory bank when:
- Making significant architectural decisions
- Discovering new patterns or approaches
- Completing major milestones
- Learning something that affects future work

## Troubleshooting

### Common Issues

1. **Task not auto-completed after commit**
   ```bash
   # Manually complete the task
   task-master set-status --id=<id> --status=done
   ```

2. **Complex task seems overwhelming**
   ```bash
   # Break it down into subtasks
   task-master expand --id=<id>
   ```

3. **Unclear what to work on next**
   ```bash
   # Check dashboard and next task
   task-master dashboard
   task-master next
   ```

4. **Need to understand task relationships**
   ```bash
   # List all tasks with dependencies
   task-master list
   ```

## Best Practices

1. **Stay Focused**: Work on one task at a time in dedicated branches
2. **Document Decisions**: Update memory bank with architectural choices
3. **Follow Dependencies**: Respect task dependencies for smooth development
4. **Regular Check-ins**: Use dashboard to track overall progress
5. **Break Down Complexity**: Don't struggle with overly complex tasks
6. **Consistent Commits**: Always use proper commit message format
7. **Leverage AI**: Use Cursor's TaskMaster context for better assistance

## Success Metrics

A successful TaskMaster integration provides:
- Clear visibility into project progress
- Focused development with minimal context switching
- Automatic progress tracking through Git integration
- AI-assisted development with persistent context
- Structured approach to complex problem solving
- Consistent documentation of decisions and learnings

This workflow ensures efficient, focused development while maintaining clear progress tracking and context preservation throughout the project lifecycle.
