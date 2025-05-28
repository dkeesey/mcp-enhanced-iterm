# Enhanced iTerm MCP Security Configuration Guide

## Table of Contents

1. [Security Overview](#security-overview)
2. [Threat Model](#threat-model)
3. [Authentication and Authorization](#authentication-and-authorization)
4. [Command Safety Tiers](#command-safety-tiers)
5. [Network Security](#network-security)
6. [Data Protection](#data-protection)
7. [Audit and Compliance](#audit-and-compliance)
8. [Incident Response](#incident-response)
9. [Security Checklist](#security-checklist)

## Security Overview

Enhanced iTerm MCP implements defense-in-depth security with multiple layers:

1. **Access Control**: Role-based permissions and API key authentication
2. **Command Validation**: Three-tier safety system for command execution
3. **Network Security**: TLS encryption and firewall rules
4. **Data Protection**: Encryption at rest and in transit
5. **Audit Logging**: Comprehensive activity tracking
6. **Incident Response**: Automated threat detection and response

## Threat Model

### Identified Threats

#### 1. Command Injection
- **Risk**: Malicious commands executed through terminal sessions
- **Mitigation**: Command validation, sandboxing, approval workflows

#### 2. Privilege Escalation
- **Risk**: Unauthorized access to elevated permissions
- **Mitigation**: Least privilege principle, sudo restrictions

#### 3. Data Exfiltration
- **Risk**: Sensitive data accessed through terminal sessions
- **Mitigation**: Output filtering, data classification, DLP rules

#### 4. Resource Exhaustion
- **Risk**: DoS through excessive session creation
- **Mitigation**: Rate limiting, resource quotas, circuit breakers

#### 5. Man-in-the-Middle
- **Risk**: Interception of MCP communications
- **Mitigation**: TLS encryption, certificate pinning

### Risk Matrix

| Threat | Likelihood | Impact | Risk Level | Mitigation Priority |
|--------|------------|--------|------------|-------------------|
| Command Injection | High | Critical | High | P0 |
| Privilege Escalation | Medium | Critical | High | P0 |
| Data Exfiltration | Medium | High | Medium | P1 |
| Resource Exhaustion | High | Medium | Medium | P1 |
| MITM Attack | Low | High | Medium | P2 |

## Authentication and Authorization

### 1. API Key Management

#### Key Generation
```javascript
// Secure key generation
const crypto = require('crypto');

function generateApiKey() {
  const key = crypto.randomBytes(32).toString('base64url');
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  
  return {
    key: `mcp_${key}`,
    hash: hash,
    created: new Date().toISOString()
  };
}
```

#### Key Storage
```json
{
  "apiKeys": {
    "mcp_AbC123...": {
      "hash": "sha256:7f83b1657ff1fc53b92dc18148a1d65d...",
      "permissions": ["session.create", "session.list", "command.execute"],
      "rateLimit": {
        "requests": 1000,
        "period": "1h"
      },
      "expires": "2024-12-31T23:59:59Z"
    }
  }
}
```

### 2. Role-Based Access Control (RBAC)

#### Role Definitions
```yaml
roles:
  admin:
    description: "Full system access"
    permissions:
      - "*"
    
  operator:
    description: "Session and command management"
    permissions:
      - "session.*"
      - "command.execute"
      - "performance.read"
    
  viewer:
    description: "Read-only access"
    permissions:
      - "*.read"
      - "*.list"
    
  developer:
    description: "Development environment access"
    permissions:
      - "session.create"
      - "session.close"
      - "command.execute"
    restrictions:
      - maxSessions: 5
      - allowedCommands: ["npm", "node", "git"]
```

#### Permission Enforcement
```typescript
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

class PermissionChecker {
  check(user: User, permission: Permission): boolean {
    // Check direct permissions
    if (user.permissions.includes(`${permission.resource}.${permission.action}`)) {
      return this.evaluateConditions(permission.conditions);
    }
    
    // Check wildcard permissions
    if (user.permissions.includes(`${permission.resource}.*`) ||
        user.permissions.includes(`*.${permission.action}`)) {
      return this.evaluateConditions(permission.conditions);
    }
    
    return false;
  }
}
```

### 3. OAuth2 Integration

```javascript
// OAuth2 configuration
const oauth2Config = {
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  authorizationURL: 'https://auth.company.com/oauth/authorize',
  tokenURL: 'https://auth.company.com/oauth/token',
  callbackURL: 'https://mcp.company.com/auth/callback',
  scope: ['read:sessions', 'write:commands']
};

// Token validation
async function validateToken(token: string): Promise<boolean> {
  const decoded = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'https://auth.company.com',
    audience: 'enhanced-iterm-mcp'
  });
  
  return decoded.exp > Date.now() / 1000;
}
```

## Command Safety Tiers

### 1. Tier Configuration

```json
{
  "safetyTiers": {
    "safe": {
      "description": "Automatically approved commands",
      "patterns": [
        "^ls\\s",
        "^pwd$",
        "^echo\\s",
        "^cat\\s[^>]*$",
        "^grep\\s",
        "^find\\s.*-name",
        "^npm\\s(list|info|view)"
      ],
      "autoApprove": true
    },
    
    "review": {
      "description": "Requires review before execution",
      "patterns": [
        "^git\\s(push|pull|merge)",
        "^npm\\s(install|update)",
        "^pip\\s(install|uninstall)",
        "^docker\\s",
        "^kubectl\\s"
      ],
      "requiresApproval": true,
      "approvalTimeout": 30000
    },
    
    "dangerous": {
      "description": "High-risk commands requiring explicit approval",
      "patterns": [
        "^rm\\s",
        "^sudo\\s",
        "^chmod\\s[0-7]{3}",
        "^chown\\s",
        ".*\\|\\s*sudo",
        ".*>`.*`",
        "^kill\\s",
        "^pkill\\s"
      ],
      "requiresApproval": true,
      "requiresReason": true,
      "approvalLevel": "admin",
      "auditLog": true
    },
    
    "blocked": {
      "description": "Never allowed",
      "patterns": [
        "^rm\\s-rf\\s/",
        "^mkfs\\.",
        "^dd\\s.*of=/dev/",
        ":(){ :|:& };:",
        "^curl\\s.*\\|\\s*sh"
      ],
      "blocked": true
    }
  }
}
```

### 2. Command Validation Implementation

```typescript
class CommandValidator {
  private tiers: SafetyTierConfig;
  
  async validate(command: string, context: ExecutionContext): Promise<ValidationResult> {
    // Check blocked commands first
    if (this.isBlocked(command)) {
      return {
        allowed: false,
        reason: 'Command is on blocklist',
        tier: 'blocked'
      };
    }
    
    // Determine safety tier
    const tier = this.determineTier(command);
    
    // Apply tier-specific validation
    switch (tier) {
      case 'safe':
        return { allowed: true, tier: 'safe' };
        
      case 'review':
        return await this.requestApproval(command, context, 'review');
        
      case 'dangerous':
        return await this.requestAdminApproval(command, context);
        
      default:
        return { allowed: false, reason: 'Unknown command tier' };
    }
  }
  
  private sanitizeCommand(command: string): string {
    // Remove potential injection attempts
    return command
      .replace(/[;&|<>]/g, ' ')
      .replace(/\$\(/g, '')
      .replace(/`/g, '')
      .trim();
  }
}
```

### 3. Approval Workflow

```typescript
interface ApprovalRequest {
  id: string;
  command: string;
  tier: string;
  requestor: string;
  context: ExecutionContext;
  timestamp: Date;
  expiresAt: Date;
}

class ApprovalManager {
  async requestApproval(request: ApprovalRequest): Promise<ApprovalResult> {
    // Store request
    await this.store.save(request);
    
    // Notify approvers
    await this.notifyApprovers(request);
    
    // Wait for approval
    return await this.waitForApproval(request.id, request.expiresAt);
  }
  
  private async notifyApprovers(request: ApprovalRequest): Promise<void> {
    const approvers = await this.getApprovers(request.tier);
    
    for (const approver of approvers) {
      await this.sendNotification(approver, {
        type: 'approval_request',
        title: `Command approval needed: ${request.tier}`,
        message: `User ${request.requestor} wants to execute: ${request.command}`,
        actions: [
          { label: 'Approve', action: 'approve', id: request.id },
          { label: 'Reject', action: 'reject', id: request.id }
        ]
      });
    }
  }
}
```

## Network Security

### 1. TLS Configuration

```javascript
// TLS server configuration
const tlsOptions = {
  key: fs.readFileSync('/etc/ssl/private/mcp.key'),
  cert: fs.readFileSync('/etc/ssl/certs/mcp.crt'),
  ca: fs.readFileSync('/etc/ssl/certs/ca-bundle.crt'),
  
  // Security settings
  minVersion: 'TLSv1.2',
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384'
  ].join(':'),
  
  // Client certificate validation
  requestCert: true,
  rejectUnauthorized: true
};

const server = https.createServer(tlsOptions, app);
```

### 2. Firewall Rules

```bash
#!/bin/bash
# Enhanced iTerm MCP firewall configuration

# Reset rules
pfctl -F all

# Allow established connections
echo "pass in quick proto tcp from any to any port 3456 flags S/SA keep state" >> /etc/pf.conf

# Rate limiting
echo "block in quick proto tcp from any to any port 3456 flags S/SA \
  keep state (max-src-conn 100, max-src-conn-rate 10/5)" >> /etc/pf.conf

# IP allowlist
for ip in $(cat /etc/enhanced-iterm-mcp/allowed-ips.txt); do
  echo "pass in quick proto tcp from $ip to any port 3456" >> /etc/pf.conf
done

# Block all other connections
echo "block in proto tcp from any to any port 3456" >> /etc/pf.conf

# Load rules
pfctl -f /etc/pf.conf
pfctl -e
```

### 3. Certificate Management

```bash
# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout mcp.key -out mcp.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=mcp.local"

# Generate CSR for production
openssl req -new -newkey rsa:2048 -nodes \
  -keyout mcp.key -out mcp.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=mcp.company.com"

# Certificate renewal automation
cat > /etc/cron.d/cert-renewal << EOF
0 0 1 * * root /usr/local/bin/certbot renew --post-hook "systemctl reload enhanced-iterm-mcp"
EOF
```

## Data Protection

### 1. Encryption at Rest

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

class DataEncryption {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;
  
  constructor() {
    this.key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  }
  
  encrypt(data: string): EncryptedData {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }
  
  decrypt(encrypted: EncryptedData): string {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encrypted.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
    
    let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### 2. Sensitive Data Handling

```typescript
class SensitiveDataFilter {
  private patterns = [
    // API Keys
    /api[_-]?key[_-]?=[\w-]+/gi,
    /bearer\s+[\w-]+/gi,
    
    // Passwords
    /password[_-]?=[\w-]+/gi,
    /pwd[_-]?=[\w-]+/gi,
    
    // Credit Cards
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    
    // SSN
    /\b\d{3}-\d{2}-\d{4}\b/g,
    
    // Private Keys
    /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]+?-----END/g
  ];
  
  filter(output: string): string {
    let filtered = output;
    
    for (const pattern of this.patterns) {
      filtered = filtered.replace(pattern, '[REDACTED]');
    }
    
    return filtered;
  }
  
  detectSensitive(text: string): boolean {
    return this.patterns.some(pattern => pattern.test(text));
  }
}
```

### 3. Key Management

```yaml
# HashiCorp Vault configuration
storage "file" {
  path = "/opt/vault/data"
}

listener "tcp" {
  address = "127.0.0.1:8200"
  tls_disable = 0
  tls_cert_file = "/opt/vault/tls/cert.pem"
  tls_key_file = "/opt/vault/tls/key.pem"
}

# Key rotation policy
path "secret/enhanced-iterm-mcp/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Automatic key rotation
path "sys/rotate" {
  capabilities = ["update"]
}
```

## Audit and Compliance

### 1. Audit Logging Configuration

```typescript
interface AuditEvent {
  timestamp: Date;
  eventType: string;
  userId: string;
  sessionId?: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
  ipAddress: string;
  userAgent?: string;
}

class AuditLogger {
  private writers: AuditWriter[] = [
    new FileAuditWriter('/var/log/mcp-audit/audit.log'),
    new SyslogAuditWriter('mcp-audit'),
    new SIEMAuditWriter('https://siem.company.com/api/events')
  ];
  
  async log(event: AuditEvent): Promise<void> {
    // Add integrity hash
    const eventWithHash = {
      ...event,
      hash: this.computeHash(event)
    };
    
    // Write to all destinations
    await Promise.all(
      this.writers.map(writer => writer.write(eventWithHash))
    );
  }
  
  private computeHash(event: AuditEvent): string {
    const content = JSON.stringify(event);
    return crypto.createHash('sha256').update(content).digest('hex');
  }
}
```

### 2. Compliance Reports

```typescript
class ComplianceReporter {
  async generateSOC2Report(period: DateRange): Promise<SOC2Report> {
    return {
      period,
      controls: {
        cc6_1: await this.logicalAccessControls(period),
        cc6_2: await this.privilegedAccessManagement(period),
        cc6_3: await this.encryptionControls(period),
        cc7_1: await this.changeManagement(period),
        cc7_2: await this.monitoringControls(period)
      },
      incidents: await this.securityIncidents(period),
      metrics: await this.securityMetrics(period)
    };
  }
  
  async generatePCIReport(period: DateRange): Promise<PCIReport> {
    return {
      requirement_2: await this.defaultPasswordsCheck(),
      requirement_7: await this.accessControlMatrix(),
      requirement_8: await this.userAuthentication(),
      requirement_10: await this.auditTrails(period),
      requirement_11: await this.securityTesting()
    };
  }
}
```

### 3. Data Retention Policies

```json
{
  "retention": {
    "audit_logs": {
      "duration": "7y",
      "compression": "gzip",
      "encryption": true,
      "archiveLocation": "s3://audit-archive/mcp/"
    },
    "session_logs": {
      "duration": "90d",
      "compression": "zstd",
      "encryption": true,
      "purgeSchedule": "0 2 * * 0"
    },
    "performance_metrics": {
      "duration": "30d",
      "aggregation": {
        "1h": "7d",
        "1d": "30d"
      }
    },
    "security_events": {
      "duration": "1y",
      "immutable": true,
      "backup": "offline"
    }
  }
}
```

## Incident Response

### 1. Incident Detection

```typescript
class IncidentDetector {
  private rules: DetectionRule[] = [
    {
      name: 'brute_force_attempt',
      condition: 'failed_auth_count > 5 within 1m',
      severity: 'high',
      response: 'block_ip'
    },
    {
      name: 'privilege_escalation',
      condition: 'sudo_commands > 10 within 5m',
      severity: 'critical',
      response: 'isolate_session'
    },
    {
      name: 'data_exfiltration',
      condition: 'output_size > 100MB within 10m',
      severity: 'high',
      response: 'alert_security'
    }
  ];
  
  async detectIncidents(events: SecurityEvent[]): Promise<Incident[]> {
    const incidents: Incident[] = [];
    
    for (const rule of this.rules) {
      if (this.evaluateRule(rule, events)) {
        incidents.push({
          id: uuidv4(),
          rule: rule.name,
          severity: rule.severity,
          timestamp: new Date(),
          events: this.getMatchingEvents(rule, events),
          response: rule.response
        });
      }
    }
    
    return incidents;
  }
}
```

### 2. Automated Response

```typescript
class IncidentResponder {
  async respond(incident: Incident): Promise<ResponseResult> {
    switch (incident.response) {
      case 'block_ip':
        return await this.blockIP(incident);
        
      case 'isolate_session':
        return await this.isolateSession(incident);
        
      case 'alert_security':
        return await this.alertSecurityTeam(incident);
        
      case 'kill_session':
        return await this.killSession(incident);
        
      default:
        return await this.defaultResponse(incident);
    }
  }
  
  private async isolateSession(incident: Incident): Promise<ResponseResult> {
    const sessionId = incident.events[0].sessionId;
    
    // Freeze session
    await this.sessionManager.freeze(sessionId);
    
    // Capture session state
    const snapshot = await this.captureSnapshot(sessionId);
    
    // Notify security team
    await this.notify({
      channel: 'security-alerts',
      priority: 'high',
      message: `Session ${sessionId} isolated due to ${incident.rule}`,
      snapshot: snapshot.url
    });
    
    return { success: true, action: 'session_isolated' };
  }
}
```

### 3. Incident Playbooks

```yaml
playbooks:
  unauthorized_access:
    steps:
      - action: verify_incident
        timeout: 5m
      - action: isolate_affected_systems
        automated: true
      - action: capture_forensics
        automated: true
      - action: notify_security_team
        channels: ["slack", "pagerduty"]
      - action: begin_investigation
        assignTo: security_oncall
      - action: remediate
        requiresApproval: true
      - action: post_incident_review
        schedule: "+24h"
        
  data_breach:
    steps:
      - action: immediate_containment
        automated: true
        priority: critical
      - action: assess_scope
        timeout: 15m
      - action: legal_notification
        condition: "pii_exposed == true"
      - action: customer_notification
        condition: "customer_data_affected == true"
        template: breach_notification
      - action: forensic_analysis
        provider: external_forensics
      - action: regulatory_reporting
        deadlines:
          gdpr: 72h
          ccpa: "without delay"
```

## Security Checklist

### Pre-Deployment

- [ ] Generate strong encryption keys
- [ ] Configure TLS certificates
- [ ] Set up firewall rules
- [ ] Configure API key management
- [ ] Review command safety tiers
- [ ] Enable audit logging
- [ ] Test authentication flow
- [ ] Verify role permissions
- [ ] Configure backup encryption
- [ ] Set up monitoring alerts

### Deployment

- [ ] Verify TLS configuration
- [ ] Test certificate validation
- [ ] Confirm firewall is active
- [ ] Validate API endpoints
- [ ] Check audit log flow
- [ ] Test incident detection
- [ ] Verify data encryption
- [ ] Confirm key rotation
- [ ] Test backup procedures
- [ ] Enable security monitoring

### Post-Deployment

- [ ] Security scan results reviewed
- [ ] Penetration test scheduled
- [ ] Incident response team briefed
- [ ] Compliance audit completed
- [ ] Security metrics baseline established
- [ ] Threat model updated
- [ ] Access review completed
- [ ] Security training delivered
- [ ] Disaster recovery tested
- [ ] Documentation updated

### Ongoing

- [ ] Weekly security reports
- [ ] Monthly access reviews
- [ ] Quarterly security assessments
- [ ] Annual penetration testing
- [ ] Continuous vulnerability scanning
- [ ] Regular security training
- [ ] Incident response drills
- [ ] Compliance audits
- [ ] Key rotation schedule
- [ ] Security patch management