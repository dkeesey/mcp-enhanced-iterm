# Multi-Agent Claude Code System - New Session Starter Prompt

## 🎯 **Context: What We Built**

We've developed a sophisticated **multi-agent Claude Code coordination system** using git worktrees that enables multiple Claude Code instances to collaborate on the Enhanced iTerm MCP project without conflicts.

## 🏗 **Key Architecture Decisions**

### **Git Worktrees > Branches (Critical Insight)**
- **Problem**: Branch-based multi-agent system causes file system instability - when one Claude Code instance switches branches, other instances suddenly see different files, breaking their context
- **Solution**: Git worktrees provide each instance with isolated directories while maintaining coordination
- **Result**: Complete file system isolation + information coordination = conflict-free collaboration

### **Three-Layer Progress Tracking**
1. **Shared Resources**: TaskMaster SQLite database, read-only memory bank (single source of truth)
2. **Instance Coordination**: Task assignment, progress aggregation, memory updates (prevents duplication)  
3. **Instance Isolation**: Separate working files, dependencies, build artifacts (prevents conflicts)

## 🛠 **System Components Built**

### **Core Multi-Agent Commands**
```bash
# Worktree-based multi-agent system (RECOMMENDED)
claude-team-worktree [dir] [instances]     # Create coordinated team
claude-enhanced-iterm-team [instances]     # Enhanced iTerm MCP team
claude-coordination-status [dir]           # Monitor progress
claude-cleanup-worktrees [dir]            # Clean up system

# Advanced coordination (partially implemented)
claude-team-coordinated [dir] [instances] # Full coordination system
```

### **Files Created**
- `~/Workspace/tools/scripts/taskmaster/claude-code-worktree-aliases.sh` - Worktree commands
- `~/Workspace/tools/scripts/taskmaster/claude-coordination-system.sh` - Advanced coordination
- `~/Workspace/tools/mcp/enhanced-iterm-mcp/WORKTREE_VS_BRANCHES.md` - Architecture comparison
- `~/Workspace/tools/mcp/enhanced-iterm-mcp/MULTI_AGENT_PROGRESS_TRACKING.md` - Progress tracking design
- `~/Workspace/tools/mcp/enhanced-iterm-mcp/SHARING_MODEL_EXAMPLE.md` - Concrete sharing examples

## 🎮 **Current Project Status**

### **Enhanced iTerm MCP Project**
- **Location**: `~/Workspace/tools/mcp/enhanced-iterm-mcp/`
- **TaskMaster Integration**: 15 tasks defined, Task #1 ready to start
- **Current Task**: "Project Setup and Foundation" (TypeScript + MCP SDK setup)
- **Multi-Agent Ready**: Full worktree coordination system available

### **Quick Start Commands**
```bash
# Single instance
claude-enhanced-iterm

# Multi-agent team (2 instances)
claude-enhanced-iterm-team 2

# Multi-agent team (3 instances with full coordination)
claude-team-coordinated ~/Workspace/tools/mcp/enhanced-iterm-mcp 3
```

## 🤖 **Claude Quota Considerations**

### **Critical Question**: Do multiple Claude Code instances exhaust quota faster?

**Answer**: **YES** - Each Claude Code instance consumes your Claude quota independently:

- **2 instances = 2x quota usage**
- **3 instances = 3x quota usage**  
- **Each instance's conversations count toward your total limit**

### **Quota Management Strategies**

1. **Start Small**: Begin with 2 instances, scale up as needed
2. **Task-Specific Scaling**: Use more instances for complex tasks, fewer for simple ones
3. **Strategic Usage**: Use multi-agent for high-value work that benefits from parallelization
4. **Monitor Usage**: Track quota consumption across instances

### **When Multi-Agent Is Worth The Quota Cost**
- ✅ Complex projects with parallel workstreams (like Enhanced iTerm MCP)
- ✅ Research + development tasks that can be parallelized
- ✅ Large codebases where different instances can work on separate modules
- ✅ Time-sensitive projects where speed justifies quota usage

### **When Single Instance Is Better**
- ❌ Simple, linear tasks
- ❌ Quota constraints
- ❌ Tasks requiring deep, continuous context (single-threaded thinking)

## 🚀 **Recommended Next Steps**

### **Option 1: Conservative Start (Single Instance)**
```bash
claude-enhanced-iterm
# Then: "Please read CLAUDE_CODE_CONTEXT.md and start Task #1 - Project Setup"
```

### **Option 2: Multi-Agent Start (2 Instances)**
```bash
claude-enhanced-iterm-team 2
# Instance 1: "Work on Task #1 - Project Setup"
# Instance 2: "Research Task #2 - analyze existing iTerm MCP implementation"
```

### **Option 3: Full Coordination (3+ Instances)**
```bash
claude-team-coordinated ~/Workspace/tools/mcp/enhanced-iterm-mcp 3
# Automatic task assignment with full coordination
```

## 📊 **Project Context for New Session**

### **Business Goal**
Develop advanced iTerm MCP server enabling multi-session management and Claude Code orchestration for 3-5x faster project completion.

### **Technical Approach**
- Extend existing iTerm MCP (don't rebuild)
- TypeScript + MCP SDK
- AppleScript for iTerm integration
- Backward compatibility maintained
- Real-world validation with Walt Opie project

### **Current Priority**
Task #1: "Project Setup and Foundation" - establish TypeScript project with MCP SDK, testing framework, and development tools.

## 🎯 **Session Starter Questions**

1. **Quota Preference**: How many Claude Code instances do you want to start with? (1, 2, or 3+)
2. **Focus Area**: Should we start with Task #1 (Project Setup) or prefer research tasks first?
3. **Coordination Level**: Basic worktree system or full coordination with progress tracking?

## 🔧 **Setup Verification**

Before starting, verify systems are ready:
```bash
# Check if worktree aliases are loaded
claude-worktree-help

# Check Enhanced iTerm MCP project status  
cd ~/Workspace/tools/mcp/enhanced-iterm-mcp && npm run dashboard

# Verify coordination system availability
ls ~/Workspace/tools/scripts/taskmaster/claude-*-aliases.sh
```

## 💡 **Key Insights to Remember**

1. **Worktree Architecture**: Each instance gets isolated file system but shared coordination
2. **Quota Impact**: Multiple instances = multiple quota usage (plan accordingly)
3. **Task Assignment**: Coordination prevents duplication, enables parallel work
4. **Progress Tracking**: Three-layer system maintains visibility across all instances
5. **Memory Coordination**: Shared discoveries without file conflicts

---

**Ready to start multi-agent Enhanced iTerm MCP development with full quota awareness and coordination system!**
