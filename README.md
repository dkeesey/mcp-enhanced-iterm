# Enhanced iTerm MCP 🚀

**Multi-session iTerm2 orchestration for Claude Desktop - Coordinate multiple Claude Code instances like a conductor!**

## What is this?

Enhanced iTerm MCP extends the original iTerm MCP with powerful multi-session capabilities, allowing Claude Desktop to:
- 🎯 Manage multiple iTerm2 sessions simultaneously  
- 🤖 Coordinate multiple Claude Code instances
- 📊 Distribute complex tasks across AI agents
- 🔒 Enforce three-tier safety controls
- 📈 Monitor performance in real-time
- 🔄 Recover from errors automatically

## Quick Start

### 1. Install
```bash
# Clone or navigate to the project
cd /Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp

# Run the installer
./install.sh
```

### 2. Restart Claude Desktop
Quit and reopen Claude Desktop to load the new MCP server.

### 3. Test It
Ask Claude: "List all available iTerm sessions"

## Key Features

### 32 MCP Tools Available
- **Session Management** (8 tools) - Create, switch, manage multiple sessions
- **Task Distribution** (4 tools) - Split work across Claude instances  
- **Progress Tracking** (4 tools) - Monitor and aggregate results
- **Safety Controls** (6 tools) - Three-tier safety system
- **Performance Monitoring** (4 tools) - Real-time metrics
- **Error Recovery** (5 tools) - Automatic retry and health checks
- **Validation** (1 tool) - Test the system

### Safety Tiers
- **Tier 1**: Full autonomy (safe operations only)
- **Tier 2**: Supervised execution (requires approval)
- **Tier 3**: Manual control only (strict limits)

## Example Usage

### Create Multiple Sessions
```
Claude: "Create 3 iTerm sessions for parallel analysis"
```

### Distribute Complex Task
```
Claude: "Distribute these tasks across Claude Code instances:
1. Analyze the codebase structure
2. Find security vulnerabilities  
3. Suggest performance improvements
4. Generate documentation"
```

### Monitor Performance
```
Claude: "Show me performance metrics for all active sessions"
```

## Manual Installation

If the installer doesn't work, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for manual steps.

## Configuration

Edit Claude Desktop config at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add:
```json
{
  "mcpServers": {
    "enhanced-iterm": {
      "command": "node",
      "args": ["/path/to/enhanced-iterm-mcp/dist/index.js"]
    }
  }
}
```

## Troubleshooting

### MCP not showing up?
1. Check Claude Desktop was restarted
2. Verify the path in config is absolute
3. Check logs: `~/Library/Logs/Claude/mcp.log`

### Permission errors?
Grant Accessibility permissions to:
- Terminal.app
- iTerm.app  
- Claude Desktop.app

## Development

### Build from source
```bash
npm install
npm run build
```

### Run tests
```bash
npm test
```

### View task progress
```bash
npx task-master list
```

## Architecture

- **12 TypeScript modules** implementing core functionality
- **Modular design** with clear separation of concerns
- **Full backward compatibility** with original iTerm MCP
- **Comprehensive error handling** and recovery
- **Real-time monitoring** and performance tracking

## License

MIT

## Credits

Built on top of the original iTerm MCP, enhanced with multi-agent coordination capabilities for the Walt Opie project.

---

**Ready to orchestrate your AI team? Install and let Claude coordinate multiple instances like a maestro! 🎼**