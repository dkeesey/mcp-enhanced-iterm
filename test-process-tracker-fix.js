#!/usr/bin/env node

import { ProcessTracker } from './dist/core/ProcessTracker.js';

async function testProcessTracker() {
  console.log('=== Testing Fixed ProcessTracker ===\n');
  
  const tracker = new ProcessTracker();
  
  try {
    console.log('Calling monitorAllSessions()...');
    const sessions = await tracker.monitorAllSessions();
    
    console.log(`Found ${sessions.length} sessions:`);
    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.sessionId}`);
      console.log(`   TTY: ${session.tty}`);
      console.log(`   Processing: ${session.isProcessing}`);
      console.log(`   Processes: ${session.processes.length}`);
      console.log('');
    });
    
    console.log('Success! ProcessTracker is now working correctly.');
    
  } catch (error) {
    console.error('Error testing ProcessTracker:', error);
  }
}

testProcessTracker();
