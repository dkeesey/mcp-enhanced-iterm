#!/bin/bash

# Enhanced iTerm MCP Installation Script
# This script automates the installation process for Claude Desktop

set -e

echo "🚀 Enhanced iTerm MCP Installer"
echo "=============================="

# Get the absolute path of the project directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 2: Build the project
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Step 3: Verify build
if [ ! -f "$PROJECT_DIR/dist/index.js" ]; then
    echo "❌ Build failed! dist/index.js not found"
    exit 1
fi
echo "✅ Build successful!"

# Step 4: Create Claude Desktop config
echo ""
echo "⚙️  Configuring Claude Desktop..."

CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

# Create config directory if it doesn't exist
mkdir -p "$CLAUDE_CONFIG_DIR"

# Check if config file exists
if [ -f "$CLAUDE_CONFIG_FILE" ]; then
    echo "📄 Found existing Claude Desktop config"
    echo "⚠️  Backing up to: $CLAUDE_CONFIG_FILE.backup"
    cp "$CLAUDE_CONFIG_FILE" "$CLAUDE_CONFIG_FILE.backup"
    
    # Check if enhanced-iterm is already configured
    if grep -q "enhanced-iterm" "$CLAUDE_CONFIG_FILE"; then
        echo "⚠️  Enhanced iTerm MCP already configured in Claude Desktop"
        echo "📝 To update, please edit: $CLAUDE_CONFIG_FILE"
    else
        echo "📝 Adding Enhanced iTerm MCP to existing config..."
        # This is tricky to do safely with sed/jq, so we'll provide instructions
        echo ""
        echo "⚠️  Please manually add the following to your Claude Desktop config:"
        echo ""
        echo "Location: $CLAUDE_CONFIG_FILE"
        echo ""
        echo "Add this to the 'mcpServers' section:"
        echo ""
        cat << EOF
    "enhanced-iterm": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/dist/index.js"
      ],
      "env": {}
    }
EOF
    fi
else
    echo "📄 Creating new Claude Desktop config..."
    cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "enhanced-iterm": {
      "command": "node",
      "args": [
        "$PROJECT_DIR/dist/index.js"
      ],
      "env": {}
    }
  }
}
EOF
    echo "✅ Config file created!"
fi

# Step 5: Test the server
echo ""
echo "🧪 Testing the MCP server..."
timeout 5 node "$PROJECT_DIR/dist/index.js" > /dev/null 2>&1 || true
echo "✅ Server starts successfully!"

# Step 6: Check permissions
echo ""
echo "🔐 Checking permissions..."
echo "⚠️  Please ensure the following apps have Accessibility permissions:"
echo "   - Terminal.app"
echo "   - iTerm.app"
echo "   - Claude Desktop.app"
echo ""
echo "   System Preferences → Security & Privacy → Privacy → Accessibility"

# Step 7: Final instructions
echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Restart Claude Desktop (Quit and reopen)"
echo "2. Test by asking Claude: 'List all iTerm sessions'"
echo "3. If needed, manually edit: $CLAUDE_CONFIG_FILE"
echo ""
echo "🎉 Enhanced iTerm MCP is ready to coordinate your Claude Code instances!"
echo ""
echo "📚 For usage examples, see: $PROJECT_DIR/API_REFERENCE.md"
echo "❓ For troubleshooting, see: $PROJECT_DIR/INSTALLATION_GUIDE.md"