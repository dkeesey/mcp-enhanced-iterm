# Multi-Agent Progress Tracking Architecture

## 🎯 **Progress Tracking Challenge**

With multiple Claude Code instances working in isolated worktrees, we need to solve:

1. **Task Coordination**: Prevent multiple instances working on the same task
2. **Progress Aggregation**: Combine progress from all instances
3. **Memory Updates**: Coordinate updates to shared memory bank
4. **TaskMaster Integration**: Maintain single source of truth for project status

## 🏗 **Three-Layer Progress Tracking System**

### **Layer 1: Shared Resources (Single Source of Truth)**
- **TaskMaster SQLite Database**: `~/Workspace/tools/claude/memory/claude_memory.db`
  - Stores all tasks, project status, overall progress
  - Shared across all instances via external database
  - Provides atomic task assignment and completion tracking

- **Main Project Memory Bank**: `~/Workspace/tools/mcp/enhanced-iterm-mcp/memory-bank/`
  - Read-only access for all instances (via symlinks)
  - Central repository for project context and decisions
  - Updated through coordinated merge process

### **Layer 2: Instance Coordination (Distributed Coordination)**
- **Coordination Directory**: `.claude-coordination/` in main project
  - `state.json`: Active instances, task assignments, progress summaries
  - `task_queue.json`: Available tasks and assignment status
  - `memory-updates/`: Queued memory updates from instances
  - `progress-reports/`: Instance-specific progress reports

- **Task Assignment System**:
  ```json
  {
    "task_id": 1,
    "title": "Project Setup and Foundation",
    "assigned_to": "instance-1",
    "status": "in-progress",
    "assigned_at": "2025-05-26T15:30:00Z",
    "dependencies_satisfied": true
  }
  ```

### **Layer 3: Instance-Specific Tracking (Isolated Progress)**
- **Instance Directory**: `.claude-instance/` in each worktree
  - `info.json`: Instance metadata and assigned tasks
  - `progress.json`: Instance-specific progress tracking
  - `memory-contributions/`: Local memory updates to be merged
  - `coordinate.sh`: Coordination commands for the instance

## 📊 **Progress Tracking Flow**

### **Task Assignment Flow**
```
1. Instance starts → Requests task assignment
2. Coordination system checks available tasks
3. Assigns highest priority task with satisfied dependencies
4. Updates shared coordination state
5. Instance begins work on assigned task
```

### **Progress Reporting Flow**
```
1. Instance makes progress → Updates local progress.json
2. Periodic sync → Reports progress to coordination system
3. Coordination system → Updates shared state.json
4. TaskMaster integration → Updates SQLite database
5. Memory contributions → Queued for merge to main memory bank
```

### **Memory Update Flow**
```
1. Instance discovers insights → Writes to local memory-contributions/
2. Coordination script → Collects updates from all instances
3. Merge process → Combines updates without conflicts
4. Main memory bank → Updated with aggregated insights
5. All instances → See updated shared memory via symlinks
```

## 🛠 **Implementation Details**

### **TaskMaster Database Integration**
```sql
-- Enhanced task table with instance tracking
ALTER TABLE tasks ADD COLUMN assigned_instance TEXT;
ALTER TABLE tasks ADD COLUMN instance_progress TEXT; -- JSON
ALTER TABLE tasks ADD COLUMN coordination_data TEXT; -- JSON

-- Track instance assignments
CREATE TABLE IF NOT EXISTS instance_assignments (
    id INTEGER PRIMARY KEY,
    task_id INTEGER,
    instance_id TEXT,
    assigned_at TIMESTAMP,
    status TEXT,
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

### **Coordination State Schema**
```json
{
  "created": "2025-05-26T15:00:00Z",
  "instances": 3,
  "active_instances": [
    {
      "id": "instance-1",
      "worktree_path": "/path/to/enhanced-iterm-mcp-instance-1",
      "status": "active",
      "assigned_tasks": [1],
      "last_heartbeat": "2025-05-26T15:30:00Z"
    }
  ],
  "task_assignments": {
    "1": {
      "assigned_to": "instance-1",
      "status": "in-progress",
      "progress": 0.3,
      "last_update": "2025-05-26T15:25:00Z"
    }
  },
  "progress_summary": {
    "total_tasks": 15,
    "assigned": 3,
    "in_progress": 2,
    "completed": 1,
    "overall_progress": 0.2
  }
}
```

### **Instance Progress Schema**
```json
{
  "instance_id": "instance-1",
  "assigned_tasks": [
    {
      "task_id": 1,
      "title": "Project Setup and Foundation",
      "progress": 0.7,
      "status": "in-progress",
      "time_spent": 3600,
      "completion_estimate": "2h remaining",
      "blockers": [],
      "achievements": [
        "TypeScript project structure created",
        "MCP SDK integrated",
        "Basic test framework setup"
      ]
    }
  ],
  "memory_contributions": [
    {
      "file": "techContext.md",
      "type": "update",
      "content": "Added TypeScript configuration details",
      "timestamp": "2025-05-26T15:20:00Z"
    }
  ]
}
```

## 🎮 **Coordination Commands**

### **For Instance Management**
```bash
# Start coordinated team
claude-team-coordinated ~/path/to/project 3

# Monitor overall progress
claude-coordination-status ~/path/to/project

# View specific instance progress
claude-instance-status instance-1

# Reassign tasks if needed
claude-reassign-task 5 instance-2
```

### **For Individual Instances**
```bash
# Within each instance worktree
./.claude-instance/coordinate.sh report-progress
./.claude-instance/coordinate.sh request-task
./.claude-instance/coordinate.sh update-memory
./.claude-instance/coordinate.sh check-status
```

## 🧠 **Memory Bank Coordination**

### **Shared Memory Structure**
```
memory-bank/ (main project - shared read-only)
├── projectbrief.md          # Static project definition
├── productContext.md        # Static problem statement
├── systemPatterns.md        # Coordinated architecture decisions
├── techContext.md           # Coordinated technical details
├── activeContext.md         # Dynamically updated current focus
└── progress.md              # Aggregated progress from all instances
```

### **Instance Memory Contributions**
```
.claude-instance/memory-contributions/
├── systemPatterns-additions.md    # Proposed additions
├── techContext-updates.md         # Technical discoveries
├── progress-report.md              # Instance-specific progress
└── learnings.md                    # Insights to share
```

### **Memory Merge Process**
1. **Collection**: Coordination script collects contributions from all instances
2. **Conflict Detection**: Check for conflicting updates to same sections
3. **Merge Strategy**: 
   - Additive content: Merge automatically
   - Conflicting content: Create merge candidates for review
   - Critical updates: Require human approval
4. **Distribution**: Updated shared memory available to all instances

## 📈 **Progress Visualization**

### **Dashboard View**
```
🤖 Multi-Agent Progress Dashboard
=====================================

📊 Overall Progress: ████████░░ 80% (12/15 tasks)

🎯 Active Instances:
   Instance-1: Task #1 "Project Setup" ███████░░░ 70%
   Instance-2: Task #3 "API Design" ████░░░░░░ 40%  
   Instance-3: Task #2 "Research" ██████████ 100% ✅

📋 Task Pipeline:
   ✅ Completed: 3 tasks
   🔄 In Progress: 2 tasks  
   📋 Ready: 4 tasks
   ⏳ Blocked: 6 tasks (waiting for dependencies)

🧠 Memory Updates:
   📝 Pending merges: 3 contributions
   🔄 Last sync: 5 minutes ago
   ✅ Conflicts: 0
```

## 🔄 **Synchronization Strategy**

### **Heartbeat System**
- Each instance reports status every 5 minutes
- Coordination system detects inactive instances
- Automatic task reassignment if instance goes offline

### **Progress Synchronization**
- Instance progress reported in real-time during active work
- Shared coordination state updated every 30 seconds
- TaskMaster database synchronized every 2 minutes

### **Memory Synchronization**
- Memory contributions queued immediately
- Merge process runs every 10 minutes
- Conflict resolution triggered automatically

## 🎯 **Benefits of This Architecture**

1. **No Task Duplication**: Central assignment prevents multiple instances working on same task
2. **Real-Time Coordination**: Live progress tracking across all instances
3. **Conflict-Free Memory**: Coordinated memory updates prevent overwrites
4. **Scalable**: Can handle 2-10+ instances with same coordination overhead
5. **Fault Tolerant**: Instance failures don't affect other instances
6. **Transparent**: Clear visibility into what each instance is doing
7. **TaskMaster Integration**: Maintains single source of truth in SQLite database

This architecture enables true multi-agent collaboration while maintaining the isolation benefits of worktrees and providing comprehensive progress tracking across all levels of the system.
