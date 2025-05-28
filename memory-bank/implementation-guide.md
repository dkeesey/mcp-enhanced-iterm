# Enhanced iTerm MCP Implementation Guide

## Quick Start for Instance 1

This guide provides actionable steps for implementing the enhanced iTerm MCP server based on the research and analysis completed by Instance 2.

## Project Setup (Task #1)

### 1. Initialize TypeScript Project
```bash
# Create project structure
mkdir -p src/{core,tools,orchestration,utils}
mkdir -p tests/{unit,integration}

# Initialize package.json
npm init -y
npm pkg set type="module"
npm pkg set scripts.build="tsc"
npm pkg set scripts.test="jest"
npm pkg set scripts.dev="tsc --watch"
```

### 2. Install Dependencies
```bash
# Core dependencies
npm install @modelcontextprotocol/sdk

# Development dependencies  
npm install -D typescript @types/node jest @types/jest ts-jest
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint
```

### 3. Configure TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## Core Implementation Structure

### 1. Main Server Entry Point
```typescript
// src/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SessionManager } from './core/SessionManager.js';
import { registerTools } from './tools/index.js';

const server = new Server(
  {
    name: 'enhanced-iterm-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize core components
const sessionManager = new SessionManager();

// Register all tools
registerTools(server, sessionManager);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. Session Manager Core
```typescript
// src/core/SessionManager.ts
import { Session, SessionOptions } from '../types/index.js';
import { AppleScriptBridge } from '../utils/AppleScriptBridge.js';
import { generateId } from '../utils/helpers.js';

export class SessionManager {
  private sessions = new Map<string, Session>();
  private activeSessionId: string | null = null;
  private applescript = new AppleScriptBridge();

  async createSession(options: SessionOptions): Promise<Session> {
    const id = generateId();
    
    // Create iTerm tab
    const tabInfo = await this.applescript.createTab(options.profile);
    
    // Initialize session
    const session: Session = {
      id,
      name: options.name || `Session ${id}`,
      windowId: tabInfo.windowId,
      tabId: tabInfo.tabId,
      tabIndex: tabInfo.tabIndex,
      state: 'ready',
      context: {
        workingDirectory: options.workingDirectory || process.cwd(),
        environment: options.environment || {},
        shellType: 'zsh',
        commandHistory: [],
        outputBuffer: [],
        variables: {},
        runningProcesses: []
      },
      created: new Date(),
      lastActive: new Date(),
      tags: options.tags || []
    };
    
    // Store session
    this.sessions.set(id, session);
    
    // Set as active if first session
    if (!this.activeSessionId) {
      this.activeSessionId = id;
    }
    
    return session;
  }

  async switchSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    await this.applescript.switchToTab(session.windowId, session.tabId);
    this.activeSessionId = sessionId;
    session.lastActive = new Date();
  }

  getActiveSession(): Session | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) || null;
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }
}
```

### 3. AppleScript Bridge
```typescript
// src/utils/AppleScriptBridge.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class AppleScriptBridge {
  async executeScript(script: string): Promise<any> {
    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      return stdout.trim();
    } catch (error) {
      throw new Error(`AppleScript error: ${error.message}`);
    }
  }

  async createTab(profile = "Default"): Promise<TabInfo> {
    const script = `
      tell application "iTerm2"
        tell current window
          set newTab to (create tab with profile "${profile}")
          set tabId to id of newTab
          set tabIndex to index of newTab
          set windowId to id of current window
          return windowId & "," & tabId & "," & tabIndex
        end tell
      end tell
    `;
    
    const result = await this.executeScript(script);
    const [windowId, tabId, tabIndex] = result.split(',');
    
    return { windowId, tabId, tabIndex: parseInt(tabIndex) };
  }

  async writeToTerminal(tabId: string, text: string): Promise<void> {
    const escapedText = text.replace(/"/g, '\\"');
    const script = `
      tell application "iTerm2"
        tell current window
          repeat with aTab in tabs
            if id of aTab is "${tabId}" then
              tell current session of aTab
                write text "${escapedText}"
              end tell
              return
            end if
          end repeat
        end tell
      end tell
    `;
    
    await this.executeScript(script);
  }

  async readTerminalOutput(tabId: string, lines = 10): Promise<string> {
    const script = `
      tell application "iTerm2"
        tell current window
          repeat with aTab in tabs
            if id of aTab is "${tabId}" then
              tell current session of aTab
                set outputText to contents
                return outputText
              end tell
            end if
          end repeat
        end tell
      end tell
    `;
    
    const output = await this.executeScript(script);
    const outputLines = output.split('\n');
    return outputLines.slice(-lines).join('\n');
  }
}
```

## Tool Registration

### 1. Tool Registry
```typescript
// src/tools/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SessionManager } from '../core/SessionManager.js';
import { registerSessionTools } from './sessionTools.js';
import { registerLegacyTools } from './legacyTools.js';
import { registerOrchestrationTools } from './orchestrationTools.js';

export function registerTools(server: Server, sessionManager: SessionManager) {
  // Register backward-compatible tools
  registerLegacyTools(server, sessionManager);
  
  // Register new session management tools
  registerSessionTools(server, sessionManager);
  
  // Register orchestration tools
  registerOrchestrationTools(server, sessionManager);
}
```

### 2. Session Management Tools
```typescript
// src/tools/sessionTools.ts
export function registerSessionTools(server: Server, sessionManager: SessionManager) {
  // Create session tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'create_session') {
      const { name, profile, workingDirectory, environment } = request.params.arguments;
      
      const session = await sessionManager.createSession({
        name,
        profile,
        workingDirectory,
        environment
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            sessionId: session.id,
            name: session.name,
            state: session.state
          }, null, 2)
        }]
      };
    }
  });

  // List sessions tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'list_sessions') {
      const sessions = sessionManager.getAllSessions();
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(sessions.map(s => ({
            id: s.id,
            name: s.name,
            state: s.state,
            created: s.created,
            lastActive: s.lastActive
          })), null, 2)
        }]
      };
    }
  });
}
```

### 3. Backward Compatible Tools
```typescript
// src/tools/legacyTools.ts
export function registerLegacyTools(server: Server, sessionManager: SessionManager) {
  // Original write_to_terminal tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'write_to_terminal') {
      const { text, sessionId } = request.params.arguments;
      
      // Use active session if no sessionId provided (backward compatibility)
      const session = sessionId 
        ? sessionManager.getSession(sessionId)
        : sessionManager.getActiveSession();
        
      if (!session) {
        throw new Error('No active session');
      }
      
      await sessionManager.writeToSession(session.id, text);
      
      return {
        content: [{
          type: 'text',
          text: 'Command written to terminal'
        }]
      };
    }
  });
}
```

## Testing Strategy

### 1. Unit Test Example
```typescript
// tests/unit/SessionManager.test.ts
import { SessionManager } from '../../src/core/SessionManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  
  beforeEach(() => {
    sessionManager = new SessionManager();
  });
  
  test('creates session with default options', async () => {
    const session = await sessionManager.createSession({});
    
    expect(session).toHaveProperty('id');
    expect(session.state).toBe('ready');
    expect(session.context.shellType).toBe('zsh');
  });
  
  test('switches between sessions', async () => {
    const session1 = await sessionManager.createSession({ name: 'Session 1' });
    const session2 = await sessionManager.createSession({ name: 'Session 2' });
    
    await sessionManager.switchSession(session1.id);
    expect(sessionManager.getActiveSession()?.id).toBe(session1.id);
    
    await sessionManager.switchSession(session2.id);
    expect(sessionManager.getActiveSession()?.id).toBe(session2.id);
  });
});
```

### 2. Integration Test Setup
```typescript
// tests/integration/iterm-integration.test.ts
import { AppleScriptBridge } from '../../src/utils/AppleScriptBridge';

describe('iTerm Integration', () => {
  let applescript: AppleScriptBridge;
  
  beforeAll(() => {
    applescript = new AppleScriptBridge();
  });
  
  test('creates new tab in iTerm', async () => {
    const tabInfo = await applescript.createTab();
    
    expect(tabInfo).toHaveProperty('windowId');
    expect(tabInfo).toHaveProperty('tabId');
    expect(tabInfo.tabIndex).toBeGreaterThan(0);
  });
});
```

## Next Steps for Instance 1

1. **Set up the project structure** following the guide above
2. **Implement core SessionManager** with basic session tracking
3. **Create AppleScript bridge** for iTerm communication
4. **Add backward-compatible tools** to maintain existing API
5. **Implement new session tools** for multi-session support
6. **Set up testing framework** with initial tests
7. **Verify MCP protocol compliance** with test client

## Key Implementation Notes

1. **Start Simple**: Begin with basic session creation and switching
2. **Maintain Compatibility**: Ensure existing tools work unchanged
3. **Test Early**: Verify AppleScript commands work on your system
4. **Iterate**: Build features incrementally, testing each addition
5. **Document**: Keep API documentation updated as you build

## Resources

- Original iTerm MCP: https://github.com/ferrislucas/iterm-mcp
- MCP SDK Docs: https://modelcontextprotocol.io/docs
- iTerm2 AppleScript: https://iterm2.com/documentation-scripting.html
- Project Memory Bank: `/memory-bank-shared/` for all research docs

This implementation guide provides a solid foundation for Task #1. The modular architecture allows for incremental development while maintaining backward compatibility throughout the enhancement process.