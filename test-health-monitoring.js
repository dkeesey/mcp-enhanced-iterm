#!/usr/bin/env node

import { EnhancedItermMCPManager } from './dist/core/EnhancedItermMCPManager.js';

async function testHealthMonitoring() {
  console.log('=== Testing Health Monitoring with Fixed ProcessTracker ===\n');
  
  const manager = new EnhancedItermMCPManager();
  
  try {
    console.log('Running health check...');
    const healthResult = await manager.healthCheck();
    
    console.log('\nHealth Check Result:');
    console.log('- Overall Status:', healthResult.status);
    console.log('- Session Manager Status:', healthResult.sessionManager.status);
    console.log('- Process Tracker Status:', healthResult.processTracker.status);
    console.log('- Performance Monitor Status:', healthResult.performanceMonitor.status);
    
    if (healthResult.processTracker.details) {
      console.log('\nProcess Tracker Details:');
      console.log('- Active Sessions:', healthResult.processTracker.details.activeSessions);
      console.log('- Total Sessions:', healthResult.processTracker.details.totalSessions);
    }
    
    console.log('\nSessions Found:');
    if (healthResult.sessionManager.details && healthResult.sessionManager.details.sessions) {
      healthResult.sessionManager.details.sessions.forEach((session, index) => {
        console.log(`${index + 1}. ${session.id} (${session.state})`);
      });
    }
    
    console.log('\nHealth monitoring should now show 0 failures!');
    
  } catch (error) {
    console.error('Error testing health monitoring:', error);
  }
}

testHealthMonitoring();
