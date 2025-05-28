# Enhanced iTerm MCP AppleScript Fix Documentation

## Overview
This document details the critical AppleScript fixes applied to Enhanced iTerm MCP to resolve session creation failures and establish robust AppleScript execution infrastructure.

## Issues Fixed

### Issue 1: iTerm2 Variable Naming Violation
**Severity**: Critical - Prevented all session creation
**Symptom**: `Only user variables may be set. Name must start with "user."`

**Technical Details**: 
iTerm2 requires user-defined variables to use the `user.` prefix. The Enhanced iTerm MCP was incorrectly using `claude.` prefixes.

**Files Changed**: `src/session/SessionManager.ts`

**Changes Made**:
```typescript
// BEFORE (broken)
set variable named "claude.session_id" to "${sessionId}"
set variable named "claude.session_name" to "${sessionName}"  
set variable named "claude.path" to "${directory}"

// AFTER (fixed)
set variable named "user.session_id" to "${sessionId}"
set variable named "user.session_name" to "${sessionName}"
set variable named "user.path" to "${directory}"
```

### Issue 2: AppleScript Quote Escaping Infrastructure Gap
**Severity**: Critical - Would cause random failures with any special characters
**Symptom**: AppleScript syntax errors when strings contained quotes or special characters

**Solution**: Created comprehensive `AppleScriptUtils` class

**New File**: `src/utils/AppleScriptUtils.ts`

**Key Features**:
- Automatic string escaping for quotes, backslashes, special characters
- Safe script execution via temporary files
- Fallback inline execution with proper shell escaping
- Variable substitution with automatic escaping
- Centralized error handling

**Usage Pattern**:
```typescript
// OLD (unsafe)
const script = `set variable named "user.name" to "${name}"`;
await execAsync(`osascript -e '${script}'`);

// NEW (safe)  
const script = `set variable named "user.name" to "${AppleScriptUtils.escapeString(name)}"`;
await AppleScriptUtils.executeScript(script);
```

### Issue 3: AppleScript Window Reference Scope Error
**Severity**: High - Prevented session creation from working
**Symptom**: `Can't get current window of current session of tab X`

**Root Cause**: Attempting to reference `current window` from within a session context where it's not accessible.

**Fix Applied**:
```applescript
// BEFORE (broken)
tell current window
  set newTab to (create tab with profile "Default")
  tell current session of newTab
    return {windowId:id of current window, tabId:id of newTab}
  end tell
end tell

// AFTER (fixed)
tell current window  
  set currentWindow to it
  set newTab to (create tab with profile "Default")
  tell current session of newTab
    set variable named "user.session_id" to "session-id"
  end tell
  return {windowId:id of currentWindow, tabId:id of newTab}
end tell
```

## Implementation Details

### AppleScriptUtils Class Methods

#### `escapeString(str: string): string`
Escapes strings for safe AppleScript usage:
- Backslashes: `\` → `\\`
- Double quotes: `"` → `\"`  
- Single quotes: `'` → `\'`

#### `executeScript(script: string): Promise<string>`
Primary execution method using temporary files to avoid shell quote issues:
1. Writes script to `/tmp/applescript-${timestamp}.scpt`
2. Executes via `osascript "filepath"`
3. Cleans up temporary file
4. Returns result with proper error handling

#### `executeScriptInline(script: string): Promise<string>`
Fallback method for inline execution with shell escaping

#### Session Variable Helpers
- `getSessionVariable(sessionId, variableName)`: Safe variable retrieval
- `setSessionVariable(sessionId, variableName, value)`: Safe variable setting

## Testing Protocol

### Validation Steps
1. **Build Verification**: `npm run build` must complete without errors
2. **Session Creation Test**: `create_session` must succeed without AppleScript errors
3. **Quote Handling Test**: Create session with names containing quotes/special characters
4. **Variable Access Test**: Verify session variables can be set and retrieved

### Test Script Location
See `test-enhanced-iterm-mcp-fix.js` for automated validation script.

## Deployment Process

### 1. Apply Fixes
- Update SessionManager.ts with variable name fixes
- Add AppleScriptUtils.ts utility class
- Update imports and usage patterns

### 2. Build and Test
```bash
cd ~/Workspace/tools/mcp/enhanced-iterm-mcp
npm run build
```

### 3. Restart Claude Desktop
- Quit Claude Desktop completely
- Restart Claude Desktop (auto-loads fresh MCP servers)
- Verify with `ps aux | grep enhanced-iterm`

### 4. Validate Functionality
```javascript
// Test basic session creation
await create_session({name: "test-session"});

// Test with special characters
await create_session({name: "test-with-'quotes'-and-\"double\"-quotes"});
```

## Performance Impact
- **Minimal**: AppleScriptUtils adds negligible overhead
- **Reliability**: Eliminates random failures from quote/escaping issues
- **Maintainability**: Centralizes AppleScript execution logic

## Future Considerations

### Configuration Optimization
With Enhanced iTerm MCP now functional, consider removing standard `iterm-mcp` from Claude Desktop configuration to avoid conflicts and reduce resource usage.

### Additional AppleScript Methods
The AppleScriptUtils foundation enables safe implementation of:
- Window management operations
- Advanced session coordination
- iTerm2 preference manipulation
- Custom keyboard shortcut handling

## Rollback Plan
If issues arise:
1. Revert SessionManager.ts changes
2. Remove AppleScriptUtils.ts
3. Rebuild: `npm run build`  
4. Restart Claude Desktop

Original functionality will be restored (though with the original bugs).

## Success Criteria
- [x] Session creation works without AppleScript errors
- [x] Special characters in session names handled safely
- [x] No random AppleScript syntax failures
- [x] Foundation established for advanced features
- [x] Zero regression in existing functionality

**Status**: ✅ All fixes validated and operational
