import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../session/SessionManager.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    sessionManager = new SessionManager();
  });

  describe('session operations', () => {
    it('should initialize with empty sessions', () => {
      const sessions = sessionManager.getAllSessions();
      expect(sessions).toEqual([]);
    });

    it('should update session state', () => {
      // Create mock session
      const mockSession = {
        id: 'test-session',
        windowId: '1',
        tabId: '1',
        name: 'Test Session',
        state: 'idle' as const,
        context: {
          workingDirectory: '~',
          environment: {},
          history: [],
          variables: {}
        },
        created: new Date(),
        lastActive: new Date()
      };

      // Add session to internal map
      (sessionManager as any).sessions.set(mockSession.id, mockSession);

      // Update state
      sessionManager.updateSessionState('test-session', 'busy');
      
      const session = sessionManager.getSession('test-session');
      expect(session?.state).toBe('busy');
    });

    it('should return undefined for non-existent session', () => {
      const session = sessionManager.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('session parsing', () => {
    it('should parse session data correctly', () => {
      const parseMethod = (sessionManager as any).parseSessionData.bind(sessionManager);
      const data = 'windowId:1, tabId:2, sessionId:test-123, sessionName:My Session, workingDir:/home/user, tty:/dev/ttys001, isProcessing:false';
      
      const result = parseMethod(data);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('test-123');
      expect(result.name).toBe('My Session');
      expect(result.windowId).toBe('1');
      expect(result.tabId).toBe('2');
      expect(result.state).toBe('idle');
    });

    it('should generate default values for missing data', () => {
      const parseMethod = (sessionManager as any).parseSessionData.bind(sessionManager);
      const data = 'windowId:3, tabId:4, sessionId:missing value, sessionName:missing value';
      
      const result = parseMethod(data);
      
      expect(result).toBeDefined();
      expect(result.id).toBe('session-3-4');
      expect(result.name).toBe('Window 3 Tab 4');
    });
  });
});