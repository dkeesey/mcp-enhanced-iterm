#!/usr/bin/env node

/**
 * Enhanced iTerm MCP AppleScript Fix Validation Test
 * 
 * This script validates that the AppleScript fixes are working correctly
 * and should be run before merging any AppleScript-related changes.
 */

import { AppleScriptUtils } from './dist/utils/AppleScriptUtils.js';
import { SessionManager } from './dist/session/SessionManager.js';

class EnhancedITermFixValidator {
  constructor() {
    this.sessionManager = new SessionManager();
    this.testResults = [];
    this.createdSessions = [];
  }

  async runAllTests() {
    console.log('🧪 Enhanced iTerm MCP AppleScript Fix Validation Test');
    console.log('=' .repeat(60));
    
    try {
      await this.testAppleScriptUtils();
      await this.testBasicSessionCreation();
      await this.testSessionCreationWithSpecialCharacters();
      await this.testSessionVariableHandling();
      await this.testSessionEnumeration();
      
      this.printResults();
      await this.cleanup();
      
      const passed = this.testResults.filter(r => r.passed).length;
      const total = this.testResults.length;
      
      if (passed === total) {
        console.log('\n🎉 ALL TESTS PASSED! Enhanced iTerm MCP fixes are working correctly.');
        process.exit(0);
      } else {
        console.log(`\n❌ ${total - passed} tests failed. Check results above.`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Test suite crashed:', error);
      await this.cleanup();
      process.exit(1);
    }
  }

  async testAppleScriptUtils() {
    console.log('\n📝 Testing AppleScriptUtils...');
    
    // Test 1: String escaping
    await this.runTest('String Escaping', async () => {
      const testString = `Test with "double quotes" and 'single quotes' and \\backslash`;
      const escaped = AppleScriptUtils.escapeString(testString);
      
      // Should not contain unescaped quotes
      if (escaped.includes('"') && !escaped.includes('\\"')) {
        throw new Error('Double quotes not properly escaped');
      }
      if (escaped.includes("'") && !escaped.includes("\\'")) {
        throw new Error('Single quotes not properly escaped');
      }
      if (escaped.includes('\\') && !escaped.includes('\\\\')) {
        throw new Error('Backslashes not properly escaped');
      }
      
      return 'String escaping working correctly';
    });

    // Test 2: Basic script execution
    await this.runTest('Basic Script Execution', async () => {
      const result = await AppleScriptUtils.executeScript('return "test successful"');
      if (result !== 'test successful') {
        throw new Error(`Expected 'test successful', got '${result}'`);
      }
      return 'Basic script execution working';
    });

    // Test 3: Script with variables
    await this.runTest('Variable Substitution', async () => {
      const testValue = 'Hello "World" with \'quotes\'';
      const script = `return "${AppleScriptUtils.escapeString(testValue)}"`;
      const result = await AppleScriptUtils.executeScript(script);
      
      if (result !== testValue) {
        throw new Error(`Variable substitution failed. Expected: ${testValue}, Got: ${result}`);
      }
      return 'Variable substitution working correctly';
    });
  }

  async testBasicSessionCreation() {
    console.log('\n🖥️  Testing Basic Session Creation...');
    
    await this.runTest('Create Simple Session', async () => {
      const session = await this.sessionManager.createSession('test-basic-session');
      this.createdSessions.push(session.id);
      
      if (!session.id || !session.name) {
        throw new Error('Session creation failed - missing ID or name');
      }
      if (session.name !== 'test-basic-session') {
        throw new Error(`Expected name 'test-basic-session', got '${session.name}'`);
      }
      
      return `Session created successfully: ${session.id}`;
    });

    await this.runTest('Create Session with Default Name', async () => {
      const session = await this.sessionManager.createSession();
      this.createdSessions.push(session.id);
      
      if (!session.id || !session.name) {
        throw new Error('Default session creation failed');
      }
      
      return `Default session created: ${session.id} (${session.name})`;
    });
  }

  async testSessionCreationWithSpecialCharacters() {
    console.log('\n🔤 Testing Session Creation with Special Characters...');
    
    const testCases = [
      'session-with-"double-quotes"',
      "session-with-'single-quotes'",
      'session-with-\\backslash',
      'session with spaces and (parentheses)',
      'session-with-$pecial-ch@racters!',
      'session-with-émojis-🚀-and-unicode-café'
    ];

    for (const testName of testCases) {
      await this.runTest(`Special Characters: ${testName}`, async () => {
        const session = await this.sessionManager.createSession(testName);
        this.createdSessions.push(session.id);
        
        if (session.name !== testName) {
          throw new Error(`Name mismatch. Expected: '${testName}', Got: '${session.name}'`);
        }
        
        return `Special character session created successfully`;
      });
    }
  }

  async testSessionVariableHandling() {
    console.log('\n🔧 Testing Session Variable Handling...');
    
    await this.runTest('Session Variable Setting', async () => {
      // Create a test session first
      const session = await this.sessionManager.createSession('variable-test-session');
      this.createdSessions.push(session.id);
      
      // Test setting a variable with special characters
      const testValue = 'Value with "quotes" and \'apostrophes\'';
      const success = await AppleScriptUtils.setSessionVariable(
        session.id, 
        'user.test_variable', 
        testValue
      );
      
      if (!success) {
        throw new Error('Failed to set session variable');
      }
      
      return 'Session variable setting working';
    });

    await this.runTest('Session Variable Getting', async () => {
      // Find a session we created
      if (this.createdSessions.length === 0) {
        throw new Error('No sessions available for variable testing');
      }
      
      const sessionId = this.createdSessions[0];
      
      // Try to get a variable (session_name should exist)
      const sessionName = await AppleScriptUtils.getSessionVariable(sessionId, 'user.session_name');
      
      if (sessionName === null) {
        throw new Error('Failed to retrieve session variable');
      }
      
      return `Session variable retrieved: ${sessionName}`;
    });
  }

  async testSessionEnumeration() {
    console.log('\n📋 Testing Session Enumeration...');
    
    await this.runTest('Enumerate Sessions', async () => {
      const sessions = await this.sessionManager.enumerateSessions();
      
      // Should return an array (might be empty)
      if (!Array.isArray(sessions)) {
        throw new Error('Session enumeration did not return an array');
      }
      
      return `Found ${sessions.length} sessions`;
    });
  }

  async runTest(testName, testFn) {
    try {
      console.log(`  🧪 ${testName}...`);
      const result = await testFn();
      console.log(`  ✅ ${result}`);
      this.testResults.push({ name: testName, passed: true, result });
    } catch (error) {
      console.log(`  ❌ ${error.message}`);
      this.testResults.push({ name: testName, passed: false, error: error.message });
    }
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(60));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${this.testResults.length}`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test sessions...');
    
    for (const sessionId of this.createdSessions) {
      try {
        await this.sessionManager.closeSession(sessionId);
        console.log(`  ✅ Closed session: ${sessionId}`);
      } catch (error) {
        console.log(`  ⚠️  Could not close session ${sessionId}: ${error.message}`);
      }
    }
  }
}

// Run the test suite
const validator = new EnhancedITermFixValidator();
validator.runAllTests().catch(console.error);
