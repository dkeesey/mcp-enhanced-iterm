import { CommandExecutor } from './CommandExecutor.js';
export declare enum SafetyTier {
    TIER_1 = "tier1",// Full autonomy for safe operations
    TIER_2 = "tier2",// Supervised execution with approval
    TIER_3 = "tier3"
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
export declare class SafetyTiers {
    private commandExecutor;
    private sessionPolicies;
    private pendingApprovals;
    private violations;
    private readonly tierPolicies;
    constructor(commandExecutor: CommandExecutor);
    /**
     * Set safety tier for a session
     */
    setSessionSafetyTier(sessionId: string, tier: SafetyTier): void;
    /**
     * Get current safety tier for a session
     */
    getSessionSafetyTier(sessionId: string): SafetyTier;
    /**
     * Check if a command is safe to execute
     */
    checkCommandSafety(sessionId: string, command: string): Promise<{
        safe: boolean;
        requiresApproval: boolean;
        violation?: SafetyViolation;
    }>;
    /**
     * Execute command with safety checks
     */
    executeWithSafety(sessionId: string, command: string, approvalId?: string): Promise<{
        success: boolean;
        output?: string;
        error?: string;
    }>;
    /**
     * Request approval for a command
     */
    private requestApproval;
    /**
     * Approve a pending command
     */
    approveCommand(approvalId: string, approvedBy: string): boolean;
    /**
     * Reject a pending command
     */
    rejectCommand(approvalId: string, reason: string): boolean;
    /**
     * Get pending approvals
     */
    getPendingApprovals(): CommandApproval[];
    /**
     * Record a safety violation
     */
    private recordViolation;
    /**
     * Get recent violations
     */
    getViolations(sessionId?: string, limit?: number): SafetyViolation[];
    /**
     * Update session policy
     */
    updateSessionPolicy(sessionId: string, updates: Partial<SafetyPolicy>): void;
    /**
     * Get session policy
     */
    getSessionPolicy(sessionId: string): SafetyPolicy;
}
//# sourceMappingURL=SafetyTiers.d.ts.map