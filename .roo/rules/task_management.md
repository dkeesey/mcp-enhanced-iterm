# Task Management Rules for Roo Code AI

## TaskMaster Integration

This project uses TaskMaster for structured task management. Always follow these protocols:

### Task Workflow
1. Check current tasks with `task-master list`
2. Find next task with `task-master next`
3. Create branch with `task-master branch`
4. Work on implementation
5. Commit with "Task-X" in message
6. Verify completion with `task-master dashboard`

### Available Commands
- `task-master list` - List all tasks
- `task-master next` - Show next available task
- `task-master show <id>` - Show task details
- `task-master set-status --id=<id> --status=<status>` - Update task status
- `task-master expand --id=<id>` - Break down complex tasks
- `task-master analyze-complexity` - Analyze task complexity
- `task-master dashboard` - View progress overview
- `task-master branch` - Create task branch

### Memory Integration
- Each task has associated memory at `/Users/deankeesey/memory/task_<id>.json`
- Use task context when implementing features
- Update task memory with learnings and decisions
- Memory bank located in `memory-bank/` directory

### Git Integration
- Always include "Task-X" in commit messages for automatic completion
- Create branches using `task-master branch` for proper naming
- Check `task-master dashboard` for progress tracking
- Git hooks automatically mark tasks complete when "Task-X" is in commit message

### PRD Processing
- Place PRD documents in `scripts/` directory
- Generate tasks with `task-master parse-prd scripts/prd.txt`
- Generate individual task files with `task-master generate`
- Analyze complexity with `task-master analyze-complexity`

## Implementation Guidelines

When implementing tasks:
1. Reference the task's details section for implementation specifics
2. Consider dependencies on previous tasks
3. Follow the project's coding standards
4. Create appropriate tests based on the task's testStrategy
5. Update memory with any architectural decisions or learnings

### Task Completion Protocol
1. Implement the feature according to task specifications
2. Write tests following the testStrategy
3. Commit changes with format: "Description - Task-X"
4. Verify automatic task completion
5. Check next available task with `task-master next`

### Complex Task Management
1. Use `task-master analyze-complexity` to identify complex tasks
2. Break down complex tasks with `task-master expand <id>`
3. Work on subtasks in dependency order
4. Update parent task status as subtasks complete

### Session Management
1. Start each session with `task-master dashboard`
2. Select next task with `task-master next`
3. Create dedicated branch with `task-master branch`
4. Work in focused task context
5. Complete with proper commit message format

## Development Workflow Integration

### Daily Startup Routine
```bash
# Check overall progress
task-master dashboard

# See what's available to work on
task-master next

# Create branch for selected task
task-master branch
```

### During Development
- Reference task details with `task-master show <id>`
- Break down complex tasks as needed
- Maintain focus on single task per branch
- Document decisions in memory bank

### Task Completion
```bash
# Example commit message formats
git commit -m "Implement user authentication system - Task-3"
git commit -m "Add database migration scripts - Task-7"
git commit -m "Fix responsive design issues - Task-12"
```

### Troubleshooting
- If task not auto-completed, use `task-master set-status --id=<id> --status=done`
- If branch naming issues, manually create with format `task/<id>`
- If complexity analysis needed, run `task-master analyze-complexity`

This system ensures structured, focused development with clear progress tracking and AI context awareness.
