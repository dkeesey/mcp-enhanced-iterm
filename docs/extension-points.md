# Extension Points for Multi-Session Support

## Key Areas for Enhancement

### 1. Session Identification
- Current: Uses "current session of current window"
- Enhancement: Track sessions by unique IDs using iTerm's user-defined variables

### 2. AppleScript Commands for Multi-Session
```applescript
-- Create new session with ID
tell application "iTerm2"
  tell current window
    set newTab to (create tab with profile "Default")
    tell current session of newTab
      set variable named "session_id" to "session-123"
    end tell
  end tell
end tell

-- Find session by ID
tell application "iTerm2"
  repeat with aWindow in windows
    repeat with aTab in tabs of aWindow
      tell current session of aTab
        if (variable named "session_id") is "session-123" then
          select aTab
          return
        end if
      end tell
    end repeat
  end repeat
end tell
```

### 3. Architecture Extensions
- Add SessionManager class to track active sessions
- Extend CommandExecutor to accept session ID parameter
- Create session-aware versions of existing tools
- Maintain backward compatibility by defaulting to current session

### 4. New Tool Signatures
- `write_to_session(sessionId, text)`
- `read_session_output(sessionId, lines)`
- `send_control_to_session(sessionId, character)`
- `create_session(name, profile?)`
- `list_sessions()`
- `switch_session(sessionId)`