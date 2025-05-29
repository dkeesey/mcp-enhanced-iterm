import { CommandExecutor } from './CommandExecutor.js';
import { v4 as uuidv4 } from 'uuid';

export interface ClaudePromptResult {
  sessionId: string;
  prompt: string;
  response?: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export class ClaudeCodeIntegration {
  private commandExecutor: CommandExecutor;
  private activePrompts: Map<string, ClaudePromptResult> = new Map();

  constructor(commandExecutor: CommandExecutor) {
    this.commandExecutor = commandExecutor;
  }

  /**
   * Send a prompt to Claude Code in a specific session
   */
  async promptClaudeCode(sessionId: string, prompt: string): Promise<string> {
    const promptId = uuidv4();
    const promptResult: ClaudePromptResult = {
      sessionId,
      prompt,
      status: 'pending',
      startTime: new Date()
    };
    
    this.activePrompts.set(promptId, promptResult);
    
    try {
      // Format the prompt for Claude Code CLI
      // Escape single quotes and newlines for safe shell execution
      const escapedPrompt = prompt.replace(/'/g, "'\\''").replace(/\n/g, ' ');
      
      // Send the prompt to Claude Code
      // Using the claude-code CLI or equivalent command  
      // CRITICAL: Add newline to trigger Claude Code execution
      const command = `claude-code '${escapedPrompt}'\n`;
      await this.commandExecutor.writeToSession(sessionId, command);
      
      // Wait for response (with timeout)
      const response = await this.waitForResponse(sessionId, promptId);
      
      promptResult.response = response;
      promptResult.status = 'completed';
      promptResult.endTime = new Date();
      
      return response;
    } catch (error) {
      promptResult.status = 'error';
      promptResult.error = error instanceof Error ? error.message : String(error);
      promptResult.endTime = new Date();
      throw error;
    }
  }

  /**
   * Wait for Claude Code response
   */
  private async waitForResponse(sessionId: string, _promptId: string, timeout: number = 30000): Promise<string> {
    const startTime = Date.now();
    let lastOutputLength = 0;
    let stableOutputCount = 0;
    const requiredStableChecks = 3; // Output must be stable for 3 checks
    
    while (Date.now() - startTime < timeout) {
      // Read terminal output
      const output = await this.commandExecutor.readSessionOutput(sessionId, 100);
      
      // Check if output has stabilized (no new content)
      if (output.length === lastOutputLength) {
        stableOutputCount++;
        if (stableOutputCount >= requiredStableChecks) {
          // Extract the response from the output
          return this.extractClaudeResponse(output);
        }
      } else {
        stableOutputCount = 0;
        lastOutputLength = output.length;
      }
      
      // Wait before next check
      await this.sleep(500);
    }
    
    throw new Error(`Claude Code response timeout after ${timeout}ms`);
  }

  /**
   * Extract Claude's response from terminal output
   */
  private extractClaudeResponse(output: string): string {
    // Split by lines and filter out command echo and prompts
    const lines = output.split('\n');
    
    // Find where Claude's response starts (after the command)
    let responseStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine && currentLine.includes('claude-code')) {
        responseStartIndex = i + 1;
        break;
      }
    }
    
    if (responseStartIndex === -1) {
      return output; // Return full output if pattern not found
    }
    
    // Extract response lines (excluding shell prompts)
    const responseLines = [];
    for (let i = responseStartIndex; i < lines.length; i++) {
      const line = lines[i];
      // Skip shell prompts and empty lines at the end
      if (line && !line.match(/^\$|^%|^>/) && !(i === lines.length - 1 && line.trim() === '')) {
        responseLines.push(line);
      }
    }
    
    return responseLines.join('\n').trim();
  }

  /**
   * Send a prompt to multiple sessions
   */
  async promptMultipleSessions(sessionIds: string[], prompt: string): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    // Send prompts in parallel
    const promises = sessionIds.map(async (sessionId) => {
      try {
        const response = await this.promptClaudeCode(sessionId, prompt);
        results.set(sessionId, response);
      } catch (error) {
        results.set(sessionId, `Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Get status of active prompts
   */
  getActivePrompts(): ClaudePromptResult[] {
    return Array.from(this.activePrompts.values()).filter(p => p.status === 'pending');
  }

  /**
   * Get prompt history
   */
  getPromptHistory(): ClaudePromptResult[] {
    return Array.from(this.activePrompts.values());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}