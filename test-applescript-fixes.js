#!/usr/bin/env node

/**
 * Test script to validate AppleScript variable fixes in Enhanced iTerm MCP
 * Tests the critical user.* → claude.* variable renaming
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Enhanced iTerm MCP - AppleScript Fix Validation\n');
console.log('Testing critical fixes for user.* → claude.* variable renaming...\n');

// Test configuration
const tests = [
    {
        name: 'Create Basic Session',
        method: 'iterm_create_session',
        params: {
            sessionName: 'test-basic-' + Date.now(),
            command: 'echo "Basic session created successfully"'
        }
    },
    {
        name: 'Create Named Session',
        method: 'iterm_create_session',
        params: {
            sessionName: 'named-session-' + Date.now(),
            command: 'echo "Named session: Testing AppleScript variables"',
            profile: 'Default'
        }
    },
    {
        name: 'List Sessions',
        method: 'iterm_list_sessions',
        params: {}
    },
    {
        name: 'Execute Command',
        method: 'iterm_execute_command',
        params: {
            sessionId: 'current',
            command: 'echo "Command execution test"'
        }
    }
];

// Function to send JSON-RPC request
function sendRequest(method, params, id) {
    return JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
            name: method,
            arguments: params
        },
        id: id
    });
}

// Run the server
const serverPath = path.join(__dirname, 'dist', 'index.js');
const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let testIndex = 0;
let buffer = '';

// Handle server output
server.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer
    
    lines.forEach(line => {
        if (line.trim()) {
            try {
                const response = JSON.parse(line);
                console.log(`\n✅ Test "${tests[testIndex - 1].name}" Response:`);
                console.log(JSON.stringify(response, null, 2));
                
                // Check for errors
                if (response.error) {
                    console.error(`❌ Error: ${response.error.message}`);
                    if (response.error.message.includes('user is not defined')) {
                        console.error('⚠️  CRITICAL: AppleScript variable fix not applied!');
                    }
                }
                
                // Run next test
                if (testIndex < tests.length) {
                    runNextTest();
                } else {
                    console.log('\n✅ All tests completed!');
                    process.exit(0);
                }
            } catch (e) {
                // Not JSON, might be debug output
                console.log('Debug:', line);
            }
        }
    });
});

// Handle server errors
server.stderr.on('data', (data) => {
    const error = data.toString();
    console.error('Server Error:', error);
    
    // Check for critical AppleScript errors
    if (error.includes('user is not defined') || error.includes('Can\'t get user')) {
        console.error('\n❌ CRITICAL ERROR: AppleScript user.* variables not fixed!');
        console.error('The server is still using "user" instead of "claude" in AppleScript.');
        process.exit(1);
    }
});

// Handle server close
server.on('close', (code) => {
    if (code !== 0) {
        console.error(`\nServer exited with code ${code}`);
    }
});

// Function to run next test
function runNextTest() {
    if (testIndex >= tests.length) return;
    
    const test = tests[testIndex];
    console.log(`\n🧪 Running Test ${testIndex + 1}: ${test.name}`);
    console.log(`Method: ${test.method}`);
    console.log(`Params:`, test.params);
    
    const request = sendRequest(test.method, test.params, testIndex + 1);
    server.stdin.write(request + '\n');
    testIndex++;
}

// Start with initialization
console.log('🚀 Starting Enhanced iTerm MCP server...\n');

// Wait for server to initialize
setTimeout(() => {
    console.log('📝 Sending initialization request...\n');
    server.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
            protocolVersion: '1.0',
            capabilities: {}
        },
        id: 0
    }) + '\n');
    
    // Start tests after initialization
    setTimeout(runNextTest, 1000);
}, 1000);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\nStopping server...');
    server.kill();
    process.exit(0);
});