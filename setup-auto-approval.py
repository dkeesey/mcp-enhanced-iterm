#!/usr/bin/env python3
import json
import os

# Load current config
config_path = os.path.expanduser("~/.claude.json")
with open(config_path, 'r') as f:
    config = json.load(f)

# Safe development tools to auto-approve
safe_tools = [
    "bash", "str_replace_editor", "read", "write", "list_directory", 
    "create_directory", "move_file", "search_files", "get_file_info"
]

# Update both worktree instance paths
instance1_path = "/Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp-instance-1"
instance2_path = "/Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp-instance-2"

# Add configurations for both instances
for path in [instance1_path, instance2_path]:
    if path not in config["projects"]:
        config["projects"][path] = {
            "allowedTools": safe_tools,
            "history": [],
            "dontCrawlDirectory": False,
            "mcpContextUris": [],
            "mcpServers": {},
            "enabledMcpjsonServers": [],
            "disabledMcpjsonServers": [],
            "enableAllProjectMcpServers": False,
            "hasTrustDialogAccepted": True,
            "ignorePatterns": [],
            "projectOnboardingSeenCount": 0,
            "hasClaudeMdExternalIncludesApproved": True,
            "hasClaudeMdExternalIncludesWarningShown": True
        }
    else:
        config["projects"][path]["allowedTools"] = safe_tools
        config["projects"][path]["hasTrustDialogAccepted"] = True
        config["projects"][path]["hasClaudeMdExternalIncludesApproved"] = True

# Backup original
os.system(f"cp {config_path} {config_path}.backup")

# Write updated config
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Claude Code auto-approval configured for both worktree instances!")
print(f"✅ Backup saved to {config_path}.backup")
print("\nAuto-approved tools:")
for tool in safe_tools:
    print(f"  ✓ {tool}")
