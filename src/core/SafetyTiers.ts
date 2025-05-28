import { CommandExecutor } from './CommandExecutor.js';

export enum SafetyTier {
  TIER_1 = 'tier1', // Full autonomy for safe operations
  TIER_2 = 'tier2', // Supervised execution with approval
  TIER_3 = 'tier3'  // Manual control only
}

export interface SafetyPolicy {
  tier: SafetyTier;
  requireApproval: boolean;
  allowedCommands?: string[];
  blockedCommands?: string[];
  maxCommandLength: number;
  allowFileSystemWrite: boolean;
  allowNetworkAccess: boolean;
  allowProcessControl: boolean;
}

export interface CommandApproval {
  id: string;
  sessionId: string;
  command: string;
  tier: SafetyTier;
  timestamp: Date;
  approved: boolean;
  approvedBy?: string;
  reason?: string;
}

export interface SafetyViolation {
  sessionId: string;
  command: string;
  violationType: 'blocked_command' | 'requires_approval' | 'length_exceeded' | 'dangerous_pattern';
  message: string;
  timestamp: Date;
}

export class SafetyTiers {
  private commandExecutor: CommandExecutor;
  private sessionPolicies: Map<string, SafetyPolicy> = new Map();
  private pendingApprovals: Map<string, CommandApproval> = new Map();
  private violations: SafetyViolation[] = [];
  
  // Default policies for each tier
  private readonly tierPolicies: Record<SafetyTier, SafetyPolicy> = {
    [SafetyTier.TIER_1]: {
      tier: SafetyTier.TIER_1,
      requireApproval: false,
      allowedCommands: undefined, // All commands allowed
      blockedCommands: [
        'rm -rf /',
        'dd if=/dev/zero',
        'fork bomb',
        ':(){ :|:& };:',
        'mkfs',
        'format',
        'shred'
      ],
      maxCommandLength: 1000,
      allowFileSystemWrite: true,
      allowNetworkAccess: true,
      allowProcessControl: true
    },
    [SafetyTier.TIER_2]: {
      tier: SafetyTier.TIER_2,
      requireApproval: true,
      allowedCommands: [
        'ls', 'pwd', 'echo', 'cat', 'grep', 'find', 'cd',
        'npm test', 'npm run', 'git status', 'git diff'
      ],
      blockedCommands: [
        'rm -rf',
        'sudo',
        'chmod 777',
        'curl | bash',
        'wget | sh'
      ],
      maxCommandLength: 500,
      allowFileSystemWrite: false,
      allowNetworkAccess: false,
      allowProcessControl: false
    },
    [SafetyTier.TIER_3]: {
      tier: SafetyTier.TIER_3,
      requireApproval: true,
      allowedCommands: [
        'ls', 'pwd', 'echo', 'help', 'exit'
      ],
      blockedCommands: undefined, // Everything not in allowed is blocked
      maxCommandLength: 100,
      allowFileSystemWrite: false,
      allowNetworkAccess: false,
      allowProcessControl: false
    }
  };
  
  constructor(
    commandExecutor: CommandExecutor
  ) {
    this.commandExecutor = commandExecutor;
  }
  
  /**
   * Set safety tier for a session
   */
  setSessionSafetyTier(sessionId: string, tier: SafetyTier): void {
    const policy = this.tierPolicies[tier];
    this.sessionPolicies.set(sessionId, { ...policy });
  }
  
  /**
   * Get current safety tier for a session
   */
  getSessionSafetyTier(sessionId: string): SafetyTier {
    const policy = this.sessionPolicies.get(sessionId);
    return policy?.tier || SafetyTier.TIER_2; // Default to Tier 2
  }
  
  /**
   * Check if a command is safe to execute
   */
  async checkCommandSafety(sessionId: string, command: string): Promise<{
    safe: boolean;
    requiresApproval: boolean;
    violation?: SafetyViolation;
  }> {
    const policy = this.sessionPolicies.get(sessionId) || this.tierPolicies[SafetyTier.TIER_2];
    
    // Check command length
    if (command.length > policy.maxCommandLength) {
      const violation: SafetyViolation = {
        sessionId,
        command: command.substring(0, 50) + '...',
        violationType: 'length_exceeded',
        message: `Command exceeds maximum length of ${policy.maxCommandLength} characters`,
        timestamp: new Date()
      };
      this.recordViolation(violation);
      return { safe: false, requiresApproval: false, violation };
    }
    
    // Check blocked commands
    if (policy.blockedCommands) {
      for (const blocked of policy.blockedCommands) {
        if (command.includes(blocked)) {
          const violation: SafetyViolation = {
            sessionId,
            command,
            violationType: 'blocked_command',
            message: `Command contains blocked pattern: ${blocked}`,
            timestamp: new Date()
          };
          this.recordViolation(violation);
          return { safe: false, requiresApproval: false, violation };
        }
      }
    }
    
    // Check dangerous patterns
    const dangerousPatterns = [
      /rm\s+-rf\s+\//,
      /chmod\s+777/,
      /curl.*\|\s*bash/,
      /wget.*\|\s*sh/,
      />\/dev\/sd[a-z]/,
      /dd.*of=\/dev\//
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(command)) {
        const violation: SafetyViolation = {
          sessionId,
          command,
          violationType: 'dangerous_pattern',
          message: `Command matches dangerous pattern: ${pattern}`,
          timestamp: new Date()
        };
        this.recordViolation(violation);
        return { safe: false, requiresApproval: false, violation };
      }
    }
    
    // Check allowed commands for Tier 2 and 3
    if (policy.allowedCommands) {
      const commandBase = command.split(' ')[0];
      const isAllowed = policy.allowedCommands.some(allowed => 
        command.startsWith(allowed) || commandBase === allowed
      );
      
      if (!isAllowed) {
        if (policy.requireApproval) {
          return { safe: true, requiresApproval: true };
        } else {
          const violation: SafetyViolation = {
            sessionId,
            command,
            violationType: 'blocked_command',
            message: 'Command not in allowed list',
            timestamp: new Date()
          };
          this.recordViolation(violation);
          return { safe: false, requiresApproval: false, violation };
        }
      }
    }
    
    // Check if requires approval
    if (policy.requireApproval) {
      return { safe: true, requiresApproval: true };
    }
    
    return { safe: true, requiresApproval: false };
  }
  
  /**
   * Execute command with safety checks
   */
  async executeWithSafety(
    sessionId: string, 
    command: string,
    approvalId?: string
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    const safetyCheck = await this.checkCommandSafety(sessionId, command);
    
    if (!safetyCheck.safe) {
      return {
        success: false,
        error: safetyCheck.violation?.message || 'Command failed safety check'
      };
    }
    
    if (safetyCheck.requiresApproval && !approvalId) {
      const approval = await this.requestApproval(sessionId, command);
      return {
        success: false,
        error: `Command requires approval. Approval ID: ${approval.id}`
      };
    }
    
    if (approvalId) {
      const approval = this.pendingApprovals.get(approvalId);
      if (!approval || !approval.approved) {
        return {
          success: false,
          error: 'Invalid or unapproved approval ID'
        };
      }
    }
    
    try {
      await this.commandExecutor.writeToSession(sessionId, command);
      await new Promise(resolve => setTimeout(resolve, 1000));
      const output = await this.commandExecutor.readSessionOutput(sessionId, 50);
      
      return {
        success: true,
        output
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Request approval for a command
   */
  private async requestApproval(sessionId: string, command: string): Promise<CommandApproval> {
    const approval: CommandApproval = {
      id: `approval-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      sessionId,
      command,
      tier: this.getSessionSafetyTier(sessionId),
      timestamp: new Date(),
      approved: false
    };
    
    this.pendingApprovals.set(approval.id, approval);
    return approval;
  }
  
  /**
   * Approve a pending command
   */
  approveCommand(approvalId: string, approvedBy: string): boolean {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return false;
    }
    
    approval.approved = true;
    approval.approvedBy = approvedBy;
    return true;
  }
  
  /**
   * Reject a pending command
   */
  rejectCommand(approvalId: string, reason: string): boolean {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return false;
    }
    
    approval.approved = false;
    approval.reason = reason;
    this.pendingApprovals.delete(approvalId);
    return true;
  }
  
  /**
   * Get pending approvals
   */
  getPendingApprovals(): CommandApproval[] {
    return Array.from(this.pendingApprovals.values())
      .filter(a => !a.approved);
  }
  
  /**
   * Record a safety violation
   */
  private recordViolation(violation: SafetyViolation): void {
    this.violations.push(violation);
    
    // Keep only last 1000 violations
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }
  }
  
  /**
   * Get recent violations
   */
  getViolations(sessionId?: string, limit: number = 100): SafetyViolation[] {
    let violations = this.violations;
    
    if (sessionId) {
      violations = violations.filter(v => v.sessionId === sessionId);
    }
    
    return violations.slice(-limit);
  }
  
  /**
   * Update session policy
   */
  updateSessionPolicy(sessionId: string, updates: Partial<SafetyPolicy>): void {
    const currentPolicy = this.sessionPolicies.get(sessionId) || this.tierPolicies[SafetyTier.TIER_2];
    this.sessionPolicies.set(sessionId, { ...currentPolicy, ...updates });
  }
  
  /**
   * Get session policy
   */
  getSessionPolicy(sessionId: string): SafetyPolicy {
    return this.sessionPolicies.get(sessionId) || this.tierPolicies[SafetyTier.TIER_2];
  }
}