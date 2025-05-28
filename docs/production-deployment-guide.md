# Enhanced iTerm MCP Production Deployment Guide

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [High Availability Setup](#high-availability-setup)
6. [Monitoring and Alerting](#monitoring-and-alerting)
7. [Backup and Recovery](#backup-and-recovery)
8. [Scaling Guidelines](#scaling-guidelines)
9. [Troubleshooting](#troubleshooting)

## System Requirements

### Hardware Requirements

#### Minimum (Development/Testing)
- **CPU**: 4 cores @ 2.4GHz
- **RAM**: 8GB
- **Storage**: 20GB SSD
- **Network**: 100Mbps

#### Recommended (Production)
- **CPU**: 8+ cores @ 3.0GHz
- **RAM**: 32GB
- **Storage**: 100GB NVMe SSD
- **Network**: 1Gbps

#### Enterprise (High Load)
- **CPU**: 16+ cores @ 3.5GHz
- **RAM**: 64GB+
- **Storage**: 500GB NVMe SSD RAID
- **Network**: 10Gbps

### Software Requirements

- **macOS**: 12.0 (Monterey) or later
- **iTerm2**: 3.4.0 or later
- **Node.js**: 18.x LTS or 20.x LTS
- **npm**: 9.x or later
- **Claude Desktop**: Latest version

### Network Requirements

- **Ports**:
  - 3456: Main MCP server
  - 3457: WebSocket monitoring
  - 3458: Health check endpoint
  - 3459: Metrics export

- **Firewall Rules**:
  ```bash
  # Allow MCP traffic
  sudo pfctl -f /etc/pf.conf
  ```

## Pre-Deployment Checklist

### Security Audit
- [ ] Review all API keys and credentials
- [ ] Enable SSL/TLS for all connections
- [ ] Configure firewall rules
- [ ] Set up access control lists
- [ ] Enable audit logging
- [ ] Review safety tier configurations

### Performance Testing
- [ ] Load test with expected traffic
- [ ] Stress test failure scenarios
- [ ] Benchmark response times
- [ ] Validate resource limits
- [ ] Test auto-scaling triggers

### Backup Verification
- [ ] Test backup procedures
- [ ] Verify restore processes
- [ ] Document recovery time objectives
- [ ] Validate data integrity checks

## Installation

### 1. System Preparation

```bash
# Update system
sudo softwareupdate -ia

# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node@20 git python3
brew install --cask iterm2

# Verify installations
node --version  # Should be 20.x
npm --version   # Should be 9.x or later
```

### 2. Enhanced iTerm MCP Installation

```bash
# Clone repository
git clone https://github.com/your-org/enhanced-iterm-mcp.git
cd enhanced-iterm-mcp

# Install production dependencies only
npm ci --production

# Build for production
npm run build:production

# Verify installation
npm run validate
```

### 3. System Service Setup

Create launch daemon at `/Library/LaunchDaemons/com.enhanced-iterm-mcp.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" 
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.enhanced-iterm-mcp</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/opt/enhanced-iterm-mcp/dist/index.js</string>
        <string>--production</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/var/log/enhanced-iterm-mcp/error.log</string>
    <key>StandardOutPath</key>
    <string>/var/log/enhanced-iterm-mcp/output.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>MCP_CONFIG_PATH</key>
        <string>/etc/enhanced-iterm-mcp/config.json</string>
    </dict>
</dict>
</plist>
```

Load the service:
```bash
sudo launchctl load /Library/LaunchDaemons/com.enhanced-iterm-mcp.plist
sudo launchctl start com.enhanced-iterm-mcp
```

## Configuration

### 1. Production Configuration File

Create `/etc/enhanced-iterm-mcp/config.json`:

```json
{
  "server": {
    "port": 3456,
    "host": "0.0.0.0",
    "ssl": {
      "enabled": true,
      "cert": "/etc/ssl/certs/mcp.crt",
      "key": "/etc/ssl/private/mcp.key"
    }
  },
  "performance": {
    "maxSessions": 50,
    "sessionTimeout": 3600000,
    "memoryLimit": "4GB",
    "cpuThreshold": 80
  },
  "safety": {
    "defaultTier": "review",
    "approvalTimeout": 30000,
    "blacklistPatterns": [
      "rm -rf /",
      "sudo rm",
      "format",
      "mkfs"
    ]
  },
  "monitoring": {
    "enabled": true,
    "interval": 5000,
    "retention": "30d",
    "exporters": [
      {
        "type": "prometheus",
        "endpoint": "http://prometheus:9090"
      },
      {
        "type": "datadog",
        "apiKey": "${DATADOG_API_KEY}"
      }
    ]
  },
  "logging": {
    "level": "info",
    "format": "json",
    "outputs": [
      {
        "type": "file",
        "path": "/var/log/enhanced-iterm-mcp/app.log",
        "rotation": {
          "maxSize": "100MB",
          "maxFiles": 10
        }
      },
      {
        "type": "syslog",
        "facility": "local0"
      }
    ]
  },
  "clustering": {
    "enabled": true,
    "nodes": [
      "mcp-node-1.internal",
      "mcp-node-2.internal",
      "mcp-node-3.internal"
    ],
    "loadBalancing": "least-connections"
  }
}
```

### 2. Environment Variables

Create `/etc/enhanced-iterm-mcp/.env`:

```bash
# Node.js Configuration
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"

# Security
API_KEY_SALT=<generate-strong-salt>
JWT_SECRET=<generate-jwt-secret>
ENCRYPTION_KEY=<generate-encryption-key>

# Database
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgres://user:pass@localhost:5432/mcp

# External Services
DATADOG_API_KEY=<your-datadog-key>
SENTRY_DSN=<your-sentry-dsn>
SLACK_WEBHOOK=<your-slack-webhook>

# Performance
UV_THREADPOOL_SIZE=16
CLUSTER_WORKERS=auto
```

### 3. Claude Desktop Integration

Update Claude Desktop configuration:

```json
{
  "mcpServers": {
    "enhanced-iterm-mcp": {
      "command": "/usr/local/bin/node",
      "args": [
        "/opt/enhanced-iterm-mcp/dist/index.js",
        "--config", "/etc/enhanced-iterm-mcp/config.json"
      ],
      "env": {
        "NODE_ENV": "production",
        "MCP_LOG_LEVEL": "info"
      }
    }
  }
}
```

## High Availability Setup

### 1. Load Balancer Configuration

Using HAProxy for load balancing:

```
global
    maxconn 4096
    log /dev/log local0
    
defaults
    mode tcp
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    
frontend mcp_frontend
    bind *:3456 ssl crt /etc/ssl/mcp-bundle.pem
    default_backend mcp_backend
    
backend mcp_backend
    balance leastconn
    option tcp-check
    server mcp1 10.0.1.10:3456 check fall 3 rise 2
    server mcp2 10.0.1.11:3456 check fall 3 rise 2
    server mcp3 10.0.1.12:3456 check fall 3 rise 2
```

### 2. Session Replication

Configure Redis for session storage:

```bash
# Redis Sentinel configuration
port 26379
sentinel monitor mcp-master 10.0.1.20 6379 2
sentinel down-after-milliseconds mcp-master 5000
sentinel parallel-syncs mcp-master 1
sentinel failover-timeout mcp-master 10000
```

### 3. Database Clustering

PostgreSQL streaming replication:

```sql
-- On primary
CREATE ROLE replicator WITH REPLICATION LOGIN PASSWORD 'secure_password';
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_keep_segments = 64;
```

## Monitoring and Alerting

### 1. Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'enhanced-iterm-mcp'
    static_configs:
      - targets:
        - 'mcp-node-1:3458'
        - 'mcp-node-2:3458'
        - 'mcp-node-3:3458'
    metrics_path: '/metrics'
```

### 2. Grafana Dashboards

Import dashboard templates:
- System Overview: `dashboards/system-overview.json`
- Session Metrics: `dashboards/session-metrics.json`
- Performance Analysis: `dashboards/performance.json`
- Error Tracking: `dashboards/errors.json`

### 3. Alert Rules

```yaml
groups:
  - name: mcp_alerts
    rules:
      - alert: HighCPUUsage
        expr: mcp_cpu_usage > 80
        for: 5m
        annotations:
          summary: "High CPU usage detected"
          
      - alert: MemoryPressure
        expr: mcp_memory_usage_percent > 90
        for: 2m
        annotations:
          summary: "Memory pressure detected"
          
      - alert: SessionOverload
        expr: mcp_active_sessions > 45
        for: 1m
        annotations:
          summary: "Session limit approaching"
          
      - alert: HighErrorRate
        expr: rate(mcp_errors_total[5m]) > 10
        for: 2m
        annotations:
          summary: "High error rate detected"
```

## Backup and Recovery

### 1. Automated Backups

Create backup script at `/opt/enhanced-iterm-mcp/scripts/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/mnt/backups/mcp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# Backup configuration
cp -r /etc/enhanced-iterm-mcp "${BACKUP_PATH}/config"

# Backup database
pg_dump -h localhost -U mcp_user -d mcp_db > "${BACKUP_PATH}/database.sql"

# Backup Redis
redis-cli --rdb "${BACKUP_PATH}/redis.rdb"

# Backup logs
tar -czf "${BACKUP_PATH}/logs.tar.gz" /var/log/enhanced-iterm-mcp/

# Create manifest
cat > "${BACKUP_PATH}/manifest.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "version": "$(cat /opt/enhanced-iterm-mcp/package.json | jq -r .version)",
  "components": ["config", "database", "redis", "logs"]
}
EOF

# Compress backup
tar -czf "${BACKUP_DIR}/${TIMESTAMP}.tar.gz" -C "${BACKUP_DIR}" "${TIMESTAMP}"
rm -rf "${BACKUP_PATH}"

# Rotate old backups (keep last 30 days)
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_DIR}/${TIMESTAMP}.tar.gz"
```

Schedule with cron:
```bash
0 2 * * * /opt/enhanced-iterm-mcp/scripts/backup.sh >> /var/log/mcp-backup.log 2>&1
```

### 2. Recovery Procedures

Recovery script at `/opt/enhanced-iterm-mcp/scripts/restore.sh`:

```bash
#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/mcp-restore"

# Stop services
sudo launchctl stop com.enhanced-iterm-mcp

# Extract backup
mkdir -p "${RESTORE_DIR}"
tar -xzf "${BACKUP_FILE}" -C "${RESTORE_DIR}"

# Restore configuration
sudo cp -r "${RESTORE_DIR}/*/config" /etc/enhanced-iterm-mcp

# Restore database
psql -h localhost -U mcp_user -d mcp_db < "${RESTORE_DIR}/*/database.sql"

# Restore Redis
sudo systemctl stop redis
cp "${RESTORE_DIR}/*/redis.rdb" /var/lib/redis/dump.rdb
sudo systemctl start redis

# Start services
sudo launchctl start com.enhanced-iterm-mcp

echo "Recovery completed from ${BACKUP_FILE}"
```

## Scaling Guidelines

### Vertical Scaling

Monitor these metrics to determine when to scale up:
- CPU usage consistently > 70%
- Memory usage > 80%
- Response time > 500ms p95
- Queue depth > 100 tasks

### Horizontal Scaling

Add nodes when:
- Active sessions > 40 per node
- Request rate > 1000 req/s
- Geographic distribution needed

### Auto-scaling Configuration

```javascript
// auto-scaling.js
const autoScaler = {
  minNodes: 2,
  maxNodes: 10,
  metrics: {
    cpu: { threshold: 70, duration: '5m' },
    memory: { threshold: 80, duration: '5m' },
    sessions: { threshold: 40, duration: '1m' }
  },
  cooldown: 300, // seconds
  scaleUpIncrement: 1,
  scaleDownIncrement: 1
};
```

## Troubleshooting

### Common Issues

#### 1. High Memory Usage
```bash
# Check memory allocation
node --inspect dist/index.js
# Use Chrome DevTools to profile memory

# Increase memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
```

#### 2. Session Timeouts
```bash
# Check session status
curl http://localhost:3458/api/sessions

# Adjust timeout in config
"sessionTimeout": 7200000  # 2 hours
```

#### 3. Connection Refused
```bash
# Check service status
sudo launchctl list | grep mcp

# Check logs
tail -f /var/log/enhanced-iterm-mcp/error.log

# Verify ports
lsof -i :3456
```

### Debug Mode

Enable debug logging:
```bash
export DEBUG=mcp:*
export MCP_LOG_LEVEL=debug
```

### Performance Profiling

```bash
# CPU profiling
node --prof dist/index.js
node --prof-process isolate-*.log > profile.txt

# Heap snapshot
node --heapsnapshot-signal=SIGUSR2 dist/index.js
kill -USR2 <pid>
```

## Maintenance Schedule

### Daily
- Monitor error logs
- Check disk space
- Verify backup completion

### Weekly
- Review performance metrics
- Update security patches
- Test failover procedures

### Monthly
- Full system backup
- Security audit
- Capacity planning review
- Update documentation

### Quarterly
- Disaster recovery drill
- Performance optimization
- Dependency updates
- Architecture review