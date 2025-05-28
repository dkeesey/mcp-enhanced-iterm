# Enhanced iTerm MCP - Installation Guide for Claude Desktop

## Prerequisites
- macOS with iTerm2 installed
- Node.js 18+ installed
- Claude Desktop application
- Multiple Claude Code instances ready to coordinate

## Installation Steps

### 1. Build the MCP Server

```bash
# Navigate to the project directory
cd /Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Verify the build
ls -la dist/index.js
```

### 2. Make the Server Executable

Create a shell script to run the server:

```bash
# Create the executable script
cat > enhanced-iterm-mcp << 'EOF'
#!/bin/bash
node /Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp/dist/index.js
EOF

# Make it executable
chmod +x enhanced-iterm-mcp

# Move to a directory in PATH (optional)
sudo mv enhanced-iterm-mcp /usr/local/bin/
```

### 3. Configure Claude Desktop

You need to edit Claude Desktop's configuration file:

**On macOS:**
```bash
# Open the Claude Desktop config file
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Add the Enhanced iTerm MCP configuration:**

```json
{
  "mcpServers": {
    "enhanced-iterm": {
      "command": "node",
      "args": [
        "/Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

**Alternative if you created the shell script:**

```json
{
  "mcpServers": {
    "enhanced-iterm": {
      "command": "/usr/local/bin/enhanced-iterm-mcp",
      "args": [],
      "env": {}
    }
  }
}
```

### 4. Restart Claude Desktop

1. Quit Claude Desktop completely (Cmd+Q)
2. Reopen Claude Desktop
3. The Enhanced iTerm MCP should now be available

## Verification

Once installed, you can verify the MCP is working by asking Claude:

"Can you list all available iTerm sessions using the enhanced iTerm MCP?"

Claude should be able to use tools like:
- `list_terminal_sessions`
- `create_session`
- `distribute_task`
- etc.

## Usage Examples

### Example 1: Create Multiple Sessions
```
"Create 3 iTerm sessions named 'analysis-1', 'analysis-2', and 'analysis-3'"
```

### Example 2: Distribute a Complex Task
```
"Distribute the following analysis tasks across multiple Claude Code instances:
1. Analyze financial data
2. Research market trends  
3. Compile risk assessment
4. Generate executive summary"
```

### Example 3: Monitor All Sessions
```
"Show me the performance metrics and status of all active iTerm sessions"
```

## Troubleshooting

### MCP Not Showing Up
1. Check the config file syntax (must be valid JSON)
2. Ensure the path to index.js is absolute and correct
3. Check Claude Desktop logs:
   ```bash
   tail -f ~/Library/Logs/Claude/mcp.log
   ```

### Permission Errors
1. Ensure the MCP script has execute permissions
2. Check that Node.js can access the project directory
3. Try running the server manually to test:
   ```bash
   node /Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp/dist/index.js
   ```

### AppleScript Errors
1. Grant Terminal/iTerm accessibility permissions:
   - System Preferences → Security & Privacy → Privacy → Accessibility
   - Add Terminal.app and iTerm.app
   - Add Claude Desktop.app

### Build Errors
1. Ensure all TypeScript compiles:
   ```bash
   npm run build
   ```
2. Check for missing dependencies:
   ```bash
   npm install
   ```

## Advanced Configuration

### Custom Safety Tier Defaults
You can set environment variables in the MCP config:

```json
{
  "mcpServers": {
    "enhanced-iterm": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "DEFAULT_SAFETY_TIER": "tier2",
        "MAX_CONCURRENT_SESSIONS": "10"
      }
    }
  }
}
```

### Performance Tuning
For better performance with many sessions:

```json
{
  "mcpServers": {
    "enhanced-iterm": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
        "/path/to/dist/index.js"
      ]
    }
  }
}
```

## Features Available After Installation

Once installed, Claude Desktop can:

1. **Manage Multiple iTerm Sessions**
   - Create, enumerate, switch between sessions
   - Set working directories per session
   - Monitor session states

2. **Coordinate Multiple Claude Code Instances**
   - Distribute complex tasks across instances
   - Aggregate results from multiple sessions
   - Track progress in real-time

3. **Safety Controls**
   - Three-tier safety system
   - Command approval workflows
   - Violation tracking

4. **Performance Monitoring**
   - Real-time resource tracking
   - Performance alerts
   - Optimization suggestions

5. **Error Recovery**
   - Automatic retry mechanisms
   - Health monitoring
   - Graceful degradation

## Security Notes

- The MCP runs with your user permissions
- Commands are subject to safety tier restrictions
- All dangerous commands are blocked by default
- Approval required for Tier 2/3 operations

## Support

If you encounter issues:
1. Check the logs in `~/Library/Logs/Claude/`
2. Verify the build with `npm run build`
3. Test the server manually before adding to Claude Desktop
4. Ensure all paths are absolute, not relative

Happy orchestrating with Enhanced iTerm MCP! 🚀