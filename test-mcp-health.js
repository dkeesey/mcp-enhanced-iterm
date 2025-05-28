#!/usr/bin/env node

import { spawn } from 'child_process';

async function testMCPHealthMonitoring() {
  console.log('=== Testing MCP Health Monitoring ===\n');
  
  // Start the MCP server
  console.log('Starting Enhanced iTerm MCP server...');
  const server = spawn('node', ['dist/index.js'], {
    cwd: '/Users/deankeesey/Workspace/tools/mcp/enhanced-iterm-mcp',
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let stderr = '';
  server.stderr.on('data', (data) => {
    stderr += data.toString();
    console.log('Server stderr:', data.toString());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Send a request to monitor all sessions
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'monitor_all_sessions',
      arguments: {}
    }
  };
  
  console.log('Sending monitor_all_sessions request...');
  server.stdin.write(JSON.stringify(request) + '\n');
  
  // Listen for response
  let response = '';
  server.stdout.on('data', (data) => {
    response += data.toString();
    console.log('Server response:', data.toString());
  });
  
  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  server.kill();
  
  console.log('\n=== Response Analysis ===');
  console.log('Raw response:', response);
  
  if (response) {
    try {
      const parsed = JSON.parse(response);
      console.log('Parsed response:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  }
}

testMCPHealthMonitoring().catch(console.error);
