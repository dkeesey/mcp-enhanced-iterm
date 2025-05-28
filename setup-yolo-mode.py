#!/usr/bin/env python3
import json
import os

# Load current config
config_path = os.path.expanduser("~/.claude.json")
with open(config_path, 'r') as f:
    config = json.load(f)

# YOLO MODE: Auto-approve everything except truly dangerous operations
yolo_tools = [
    "bash", "str_replace_editor", "read", "write", "list_directory", 
    "create_directory", "move_file", "search_files", "get_file_info",
    # Additional tools for maximum autonomy
    "delete_file", "copy_file", "run_command", "execute_shell"
]

# Update both worktree instance paths for YOLO mode
instance1_path = "/Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp-instance-1"
instance2_path = "/Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp-instance-2"

# Set YOLO configuration - auto-approve almost everything
for path in [instance1_path, instance2_path]:
    if path in config["projects"]:
        config["projects"][path]["allowedTools"] = yolo_tools
        config["projects"][path]["hasTrustDialogAccepted"] = True
        config["projects"][path]["hasClaudeMdExternalIncludesApproved"] = True
        # Enable full autonomy flags
        config["projects"][path]["autoApproveAllTools"] = True  # Custom flag
        config["projects"][path]["yoloMode"] = True  # Custom flag

# Backup original
os.system(f"cp {config_path} {config_path}.yolo-backup")

# Write YOLO config
with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)

print("🚀 YOLO MODE ACTIVATED!")
print("⚠️  Auto-approving nearly all operations within directory boundaries")
print(f"💾 Backup saved to {config_path}.yolo-backup")
print("\nYOLO Auto-approved tools:")
for tool in yolo_tools:
    print(f"  🎯 {tool}")
print("\nSafety layers still active:")
print("  🛡️  Claude Code directory sandboxing")
print("  🛡️  Git worktree isolation") 
print("  🛡️  Git history for rollback")
print("  🛡️  Experimental project scope")
