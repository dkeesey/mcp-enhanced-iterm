# Multi-Agent Sharing Model - Concrete Example

## Instance 1 Directory Structure
```
enhanced-iterm-mcp-instance-1/
├── src/                           # ISOLATED - Instance 1's code changes
│   ├── session-manager.ts         # ← Instance 1 working on session management
│   └── index.ts                   # ← Independent modifications
├── node_modules/                  # ISOLATED - Instance 1's dependencies
├── build/                         # ISOLATED - Instance 1's build artifacts
├── memory-bank-shared/            # READ-ONLY SYMLINK - Shared context
│   ├── projectbrief.md           # ← Same for all instances
│   └── requirements.md           # ← Same for all instances  
├── .claude-coordination-shared/   # COORDINATION LINK - Shared coordination
│   ├── task-assignments.json     # ← "Instance 1: Task #1, Instance 2: Task #3"
│   └── progress-reports.json     # ← Live progress from all instances
├── .claude-instance/             # ISOLATED - Instance 1's private state
│   ├── info.json                 # ← "assigned_tasks": [1], "progress": 0.7
│   └── coordinate.sh             # ← Instance 1's coordination commands
└── package.json                  # ISOLATED - Instance 1's copy
```

## Instance 2 Directory Structure  
```
enhanced-iterm-mcp-instance-2/
├── src/                           # ISOLATED - Instance 2's code changes
│   ├── api-design.ts             # ← Instance 2 working on API design
│   └── types.ts                  # ← Different focus area
├── node_modules/                  # ISOLATED - Instance 2's dependencies
├── memory-bank-shared/            # READ-ONLY SYMLINK - Same shared context
│   ├── projectbrief.md           # ← Identical to Instance 1
│   └── requirements.md           # ← Identical to Instance 1
├── .claude-coordination-shared/   # COORDINATION LINK - Same coordination
│   ├── task-assignments.json     # ← Same coordination data
│   └── progress-reports.json     # ← Same live progress view
├── .claude-instance/             # ISOLATED - Instance 2's private state
│   ├── info.json                 # ← "assigned_tasks": [3], "progress": 0.4
│   └── coordinate.sh             # ← Instance 2's coordination commands
└── package.json                  # ISOLATED - Instance 2's copy
```

## What Each Instance Actually Shares

### 🔄 **Active Coordination (Live Updates)**
```bash
# Instance 1 reports progress
./.claude-instance/coordinate.sh report-progress
# → Updates shared coordination state
# → Instance 2 sees: "Instance 1 is 70% done with Task #1"

# Instance 2 requests next task  
./.claude-instance/coordinate.sh request-task
# → Coordination system assigns Task #5 to Instance 2
# → Instance 1 sees: "Instance 2 now working on Task #5"
```

### 📖 **Shared Context (Static Base)**
```bash
# Both instances read the same project context
cat memory-bank-shared/projectbrief.md  # Same content for both
cat memory-bank-shared/requirements.md  # Same requirements

# But they work on different code
# Instance 1: src/session-manager.ts
# Instance 2: src/api-design.ts
```

### 🧠 **Memory Coordination (Discovery Sharing)**
```bash
# Instance 1 makes an architectural discovery
./.claude-instance/coordinate.sh update-memory
# → Queues discovery: "Session management should use event-driven architecture"

# Coordination system merges discoveries
# → Updates shared memory-bank-shared/systemPatterns.md
# → Instance 2 sees the discovery and adapts its API design accordingly
```

## 🎯 **The Key Insight**

**File System**: Completely isolated (no conflicts possible)
**Information**: Coordinated sharing (via coordination system)  
**Context**: Shared read-only base + coordinated updates

## 🤖 **What Claude Code Instances Actually Experience**

### **Instance 1 (Session Management Focus)**
- **Sees**: Stable project context, assigned Task #1, progress from other instances
- **Works On**: Session management code in isolation
- **Shares**: Progress reports, architectural discoveries
- **Cannot**: Interfere with Instance 2's file changes

### **Instance 2 (API Design Focus)**  
- **Sees**: Same project context, assigned Task #3, progress from other instances
- **Works On**: API design code in isolation
- **Shares**: Progress reports, design decisions
- **Cannot**: Interfere with Instance 1's file changes

## 🔧 **Practical Example Commands**

### **What Instances Share (Coordination)**
```bash
# Check what other instances are doing
cat .claude-coordination-shared/progress-reports.json
# Shows: Instance 1 working on sessions, Instance 2 on API

# See task assignments
cat .claude-coordination-shared/task-assignments.json
# Shows: Task 1→Instance 1, Task 3→Instance 2, Task 5→Available
```

### **What Instances Don't Share (Isolation)**
```bash
# Instance 1 modifies its code
echo "new session logic" >> src/session-manager.ts
# Instance 2 never sees this change (complete isolation)

# Instance 2 installs a dependency  
npm install some-package
# Instance 1's node_modules unchanged (separate dependencies)
```

## 🎯 **Benefits of This Model**

1. **✅ Zero File Conflicts**: Impossible for instances to interfere
2. **✅ Coordinated Work**: No duplicate effort on same tasks
3. **✅ Shared Learning**: Discoveries shared across instances
4. **✅ Stable Context**: Each instance sees consistent project understanding
5. **✅ True Parallelism**: No coordination overhead for file operations
6. **✅ Clear Debugging**: Easy to see what each instance did

The worktrees provide **mechanical isolation** (file system separation) while the coordination system provides **logical collaboration** (shared information and task management).
