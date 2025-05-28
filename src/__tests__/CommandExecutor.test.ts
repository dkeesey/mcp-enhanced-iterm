import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { execSync } from 'child_process';
import { CommandExecutor } from '../core/CommandExecutor.js';

// Mock child_process module
vi.mock('child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn()
}));

describe('CommandExecutor', () => {
  let commandExecutor: CommandExecutor;
  let mockExecSync: Mock;

  beforeEach(() => {
    commandExecutor = new CommandExecutor();
    mockExecSync = execSync as Mock;
    vi.clearAllMocks();
  });

  describe('writeToTerminal', () => {
    it('should execute AppleScript to write to active terminal', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      await commandExecutor.writeToTerminal('echo "Hello World"');
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('osascript'),
        expect.objectContaining({ encoding: 'utf8' })
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('write text "echo \\"Hello World\\""'),
        expect.any(Object)
      );
    });

    it('should escape special characters in commands', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      await commandExecutor.writeToTerminal('echo "Test \\ Quote"');
      
      const call = mockExecSync.mock.calls[0][0];
      expect(call).toContain('\\\\\\"');
    });

    it('should handle errors gracefully', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('AppleScript execution failed');
      });
      
      await expect(commandExecutor.writeToTerminal('test')).rejects.toThrow('AppleScript execution failed');
    });
  });

  describe('readTerminalOutput', () => {
    it('should read specified number of lines from terminal', async () => {
      const mockOutput = 'Line 1\nLine 2\nLine 3';
      mockExecSync.mockReturnValue(Buffer.from(mockOutput));
      
      const result = await commandExecutor.readTerminalOutput(3);
      
      expect(result).toBe(mockOutput);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('contents of current session'),
        expect.any(Object)
      );
    });

    it('should default to 50 lines if not specified', async () => {
      mockExecSync.mockReturnValue(Buffer.from('output'));
      
      await commandExecutor.readTerminalOutput();
      
      expect(mockExecSync).toHaveBeenCalledOnce();
    });
  });

  describe('sendControlCharacter', () => {
    it('should send control-c character', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      await commandExecutor.sendControlCharacter('c');
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('keystroke "c" using control down'),
        expect.any(Object)
      );
    });

    it('should validate control character input', async () => {
      const validChars = ['c', 'd', 'z', 'l'];
      
      for (const char of validChars) {
        mockExecSync.mockReturnValue(Buffer.from(''));
        await expect(commandExecutor.sendControlCharacter(char)).resolves.not.toThrow();
      }
    });
  });

  describe('session-specific operations', () => {
    it('should write to specific session', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      await commandExecutor.writeToSession('session-123', 'ls -la');
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('session id "session-123"'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('write text "ls -la"'),
        expect.any(Object)
      );
    });

    it('should read from specific session', async () => {
      const mockOutput = 'Session output';
      mockExecSync.mockReturnValue(Buffer.from(mockOutput));
      
      const result = await commandExecutor.readSessionOutput('session-456', 10);
      
      expect(result).toBe(mockOutput);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('session id "session-456"'),
        expect.any(Object)
      );
    });

    it('should send control character to specific session', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      await commandExecutor.sendControlToSession('session-789', 'd');
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('session id "session-789"'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('keystroke "d" using control down'),
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should handle empty command gracefully', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''));
      
      await commandExecutor.writeToTerminal('');
      
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('write text ""'),
        expect.any(Object)
      );
    });

    it('should handle AppleScript timeout', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('AppleScript timeout');
      });
      
      await expect(commandExecutor.writeToTerminal('sleep 100')).rejects.toThrow('AppleScript timeout');
    });

    it('should handle invalid session ID', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Session not found');
      });
      
      await expect(commandExecutor.writeToSession('invalid-id', 'test')).rejects.toThrow('Session not found');
    });
  });
});