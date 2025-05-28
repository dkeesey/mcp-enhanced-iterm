# AppleScript Command Reference for iTerm2

## Overview
This reference provides tested AppleScript commands for iTerm2 automation, specifically tailored for the enhanced iTerm MCP implementation.

## Core iTerm2 Objects

### Application Object
```applescript
tell application "iTerm2"
    -- Application-level commands
end tell
```

### Window Management
```applescript
-- Get current window
tell application "iTerm2"
    set currentWin to current window
end tell

-- Create new window
tell application "iTerm2"
    create window with default profile
end tell

-- Get all windows
tell application "iTerm2"
    set allWindows to windows
end tell

-- Get window by ID
tell application "iTerm2"
    set targetWindow to window id "window-1"
end tell
```

### Tab Management
```applescript
-- Create new tab
tell application "iTerm2"
    tell current window
        create tab with profile "Default"
    end tell
end tell

-- Create tab and get its properties
tell application "iTerm2"
    tell current window
        set newTab to (create tab with profile "Default")
        set tabId to id of newTab
        set tabIndex to index of newTab
        return {tabId:tabId, tabIndex:tabIndex}
    end tell
end tell

-- Switch to specific tab
tell application "iTerm2"
    tell current window
        select tab 2  -- by index
    end tell
end tell

-- Find and switch to tab by ID
tell application "iTerm2"
    repeat with aWindow in windows
        repeat with aTab in tabs of aWindow
            if id of aTab is "tab-123" then
                tell aWindow
                    select aTab
                end tell
                return true
            end if
        end repeat
    end repeat
    return false
end tell

-- Close tab
tell application "iTerm2"
    tell current window
        close tab 2
    end tell
end tell
```

### Session Management
```applescript
-- Get current session
tell application "iTerm2"
    tell current window
        tell current tab
            set currentSess to current session
        end tell
    end tell
end tell

-- Write text to session
tell application "iTerm2"
    tell current session of current window
        write text "echo 'Hello, World!'"
    end tell
end tell

-- Write without newline
tell application "iTerm2"
    tell current session of current window
        write text "echo -n 'No newline'" without newline
    end tell
end tell

-- Get session contents
tell application "iTerm2"
    tell current session of current window
        set sessionContents to contents
    end tell
end tell

-- Get visible text only
tell application "iTerm2"
    tell current session of current window
        set visibleText to text
    end tell
end tell
```

### Split Panes
```applescript
-- Split horizontally
tell application "iTerm2"
    tell current session of current window
        split horizontally with default profile
    end tell
end tell

-- Split vertically
tell application "iTerm2"
    tell current session of current window
        split vertically with profile "MyProfile"
    end tell
end tell

-- Split and get new session reference
tell application "iTerm2"
    tell current session of current window
        set newSession to (split vertically with default profile)
        tell newSession
            write text "echo 'I am in the new pane'"
        end tell
    end tell
end tell
```

## Enhanced Session Management Commands

### Session Variables (User-Defined)
```applescript
-- Set session variable
tell application "iTerm2"
    tell current session of current window
        set variable named "session_id" to "sess-123"
        set variable named "agent_id" to "agent-456"
    end tell
end tell

-- Get session variable
tell application "iTerm2"
    tell current session of current window
        set sessionId to value of variable named "session_id"
    end tell
end tell

-- Check if variable exists
tell application "iTerm2"
    tell current session of current window
        if (exists variable named "session_id") then
            return value of variable named "session_id"
        else
            return missing value
        end if
    end tell
end tell
```

### Session State Detection
```applescript
-- Check if at shell prompt (requires Shell Integration)
tell application "iTerm2"
    tell current session of current window
        set isReady to is at shell prompt
    end tell
end tell

-- Get command being executed
tell application "iTerm2"
    tell current session of current window
        if is processing then
            set currentCommand to name
        else
            set currentCommand to ""
        end if
    end tell
end tell
```

### Advanced Session Properties
```applescript
-- Set session name
tell application "iTerm2"
    tell current session of current window
        set name to "Build Server"
    end tell
end tell

-- Set session background color
tell application "iTerm2"
    tell current session of current window
        set background color to {13107, 0, 0, 65535}  -- Dark red
    end tell
end tell

-- Set transparency
tell application "iTerm2"
    tell current session of current window
        set transparency to 0.1
    end tell
end tell

-- Get session dimensions
tell application "iTerm2"
    tell current session of current window
        set cols to columns
        set rows to rows
        return {columns:cols, rows:rows}
    end tell
end tell
```

## Control Characters and Special Keys
```applescript
-- Send Ctrl+C
tell application "iTerm2"
    tell current session of current window
        write text (ASCII character 3)  -- Ctrl+C
    end tell
end tell

-- Send Ctrl+Z
tell application "iTerm2"
    tell current session of current window
        write text (ASCII character 26)  -- Ctrl+Z
    end tell
end tell

-- Send Ctrl+D (EOF)
tell application "iTerm2"
    tell current session of current window
        write text (ASCII character 4)  -- Ctrl+D
    end tell
end tell

-- Send Tab
tell application "iTerm2"
    tell current session of current window
        write text (ASCII character 9)  -- Tab
    end tell
end tell

-- Send Escape
tell application "iTerm2"
    tell current session of current window
        write text (ASCII character 27)  -- Escape
    end tell
end tell
```

## Working with Multiple Sessions
```applescript
-- Execute command in all sessions of a window
tell application "iTerm2"
    tell current window
        repeat with aTab in tabs
            tell current session of aTab
                write text "echo 'Broadcasting to all tabs'"
            end tell
        end repeat
    end tell
end tell

-- Find session by variable value
tell application "iTerm2"
    repeat with aWindow in windows
        repeat with aTab in tabs of aWindow
            tell current session of aTab
                if (exists variable named "session_id") then
                    if value of variable named "session_id" is "target-123" then
                        return {window:aWindow, tab:aTab}
                    end if
                end if
            end tell
        end repeat
    end repeat
    return missing value
end tell
```

## Error Handling Patterns
```applescript
-- Safe command execution
tell application "iTerm2"
    try
        tell current window
            create tab with profile "Default"
        end tell
    on error errMsg number errNum
        return {success:false, error:errMsg, code:errNum}
    end try
    return {success:true}
end tell

-- Check if iTerm is running
tell application "System Events"
    set isRunning to (name of processes) contains "iTerm2"
end tell

if not isRunning then
    tell application "iTerm2" to activate
    delay 1  -- Wait for startup
end if
```

## Performance Optimization Tips

### Batch Operations
```applescript
-- Combine multiple operations in one tell block
tell application "iTerm2"
    tell current window
        set newTab to (create tab with profile "Default")
        tell current session of newTab
            set name to "Worker"
            write text "cd /project"
            write text "npm install"
        end tell
    end tell
end tell
```

### Caching References
```applescript
-- Cache window and tab references for repeated use
tell application "iTerm2"
    set targetWindow to current window
    set targetTab to current tab of targetWindow
    
    -- Multiple operations on same objects
    tell targetTab
        tell current session
            write text "command1"
            write text "command2"
            write text "command3"
        end tell
    end tell
end tell
```

## Integration Examples

### Create Named Session with Context
```applescript
on createNamedSession(sessionName, sessionId, workDir)
    tell application "iTerm2"
        tell current window
            set newTab to (create tab with profile "Default")
            tell current session of newTab
                -- Set identifiers
                set name to sessionName
                set variable named "session_id" to sessionId
                set variable named "created_at" to (current date) as string
                
                -- Set working directory
                write text "cd " & workDir
                
                -- Return session info
                return {id:sessionId, tabId:id of newTab, name:sessionName}
            end tell
        end tell
    end tell
end createNamedSession

-- Usage
set sessionInfo to createNamedSession("Build Server", "sess-123", "/Users/project")
```

### Monitor Session State
```applescript
on getSessionState(tabId)
    tell application "iTerm2"
        repeat with aWindow in windows
            repeat with aTab in tabs of aWindow
                if id of aTab is tabId then
                    tell current session of aTab
                        set sessionState to {¬
                            isProcessing:is processing, ¬
                            isAtPrompt:is at shell prompt, ¬
                            name:name, ¬
                            contents:contents ¬
                        }
                        return sessionState
                    end tell
                end if
            end repeat
        end repeat
    end tell
    return missing value
end getSessionState
```

## Best Practices

1. **Always use try-catch blocks** for error handling
2. **Cache object references** when performing multiple operations
3. **Use session variables** for metadata instead of external storage
4. **Check if iTerm is running** before executing commands
5. **Add delays after creating sessions** to ensure they're ready
6. **Escape special characters** in text strings properly
7. **Use "without newline"** when building multi-part commands
8. **Test commands interactively** in Script Editor first

## Common Pitfalls

1. **Tab indices are 1-based**, not 0-based
2. **Session IDs persist**, but tab indices can change
3. **"contents" returns entire buffer**, "text" returns visible only
4. **Some properties require Shell Integration** to work
5. **AppleScript has timeouts** for long-running operations
6. **Window IDs are strings**, not numbers
7. **Color values use 16-bit integers** (0-65535), not 8-bit

This reference provides the foundation for implementing robust iTerm2 automation in the enhanced MCP server.