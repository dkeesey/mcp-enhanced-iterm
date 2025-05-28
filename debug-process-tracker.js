#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testProcessTrackerAppleScript() {
  console.log('=== Testing ProcessTracker AppleScript ===\n');

  // This is the EXACT script from ProcessTracker.monitorAllSessions()
  const processTrackerScript = `
    tell application "iTerm2"
      set sessionInfoList to {}
      
      repeat with aWindow in windows
        repeat with aTab in tabs of aWindow
          tell current session of aTab
            set sessionInfo to {}
            
            try
              set sessionId to variable named "user.session_id"
            on error
              set sessionId to missing value
            end try
            
            if sessionId is not missing value then
              set sessionInfo to sessionInfo & {sessionId:sessionId}
              set sessionInfo to sessionInfo & {tty:tty}
              set sessionInfo to sessionInfo & {isProcessing:is processing}
              set end of sessionInfoList to sessionInfo
            end if
          end tell
        end repeat
      end repeat
      
      return sessionInfoList
    end tell
  `;

  // Compare with SessionManager script (working one)
  const sessionManagerScript = `
    tell application "iTerm2"
      set sessionList to {}
      set windowIndex to 1
      
      repeat with aWindow in windows
        set tabIndex to 1
        repeat with aTab in tabs of aWindow
          tell current session of aTab
            set sessionInfo to {windowId:windowIndex, tabId:tabIndex}
            
            try
              set sessionId to variable named "user.session_id"
              set sessionInfo to sessionInfo & {sessionId:sessionId}
            on error
              set sessionInfo to sessionInfo & {sessionId:missing value}
            end try
            
            try
              set sessionName to variable named "user.session_name"
              set sessionInfo to sessionInfo & {sessionName:sessionName}
            on error
              set sessionInfo to sessionInfo & {sessionName:missing value}
            end try
            
            try
              set workingDir to variable named "user.path"
              set sessionInfo to sessionInfo & {workingDir:workingDir}
            on error
              set sessionInfo to sessionInfo & {workingDir:missing value}
            end try
            
            set sessionInfo to sessionInfo & {tty:tty}
            set sessionInfo to sessionInfo & {isProcessing:is processing}
            
            set end of sessionList to sessionInfo
          end tell
          set tabIndex to tabIndex + 1
        end repeat
        set windowIndex to windowIndex + 1
      end repeat
      
      return sessionList
    end tell
  `;

  try {
    console.log('1. Testing ProcessTracker AppleScript...');
    const { stdout: processTrackerOutput } = await execAsync(`osascript -e '${processTrackerScript}'`);
    console.log('ProcessTracker Output:', processTrackerOutput);
    console.log('ProcessTracker Output Length:', processTrackerOutput.length);
    console.log('ProcessTracker Raw Output:', JSON.stringify(processTrackerOutput));
    
    console.log('\n2. Testing SessionManager AppleScript...');
    const { stdout: sessionManagerOutput } = await execAsync(`osascript -e '${sessionManagerScript}'`);
    console.log('SessionManager Output:', sessionManagerOutput);
    console.log('SessionManager Output Length:', sessionManagerOutput.length);
    console.log('SessionManager Raw Output:', JSON.stringify(sessionManagerOutput));
    
    console.log('\n3. Difference Analysis:');
    console.log('ProcessTracker returns empty?', processTrackerOutput.trim() === '');
    console.log('SessionManager returns empty?', sessionManagerOutput.trim() === '');
    
    // Test a simple session enumeration
    console.log('\n4. Simple session enumeration test...');
    const simpleScript = `
      tell application "iTerm2"
        set sessionList to {}
        repeat with aWindow in windows
          repeat with aTab in tabs in aWindow
            tell current session of aTab
              try
                set sessionId to variable named "user.session_id"
                if sessionId is not missing value then
                  set end of sessionList to sessionId
                end if
              on error
                -- ignore errors
              end try
            end tell
          end repeat
        end repeat
        return sessionList
      end tell
    `;
    
    const { stdout: simpleOutput } = await execAsync(`osascript -e '${simpleScript}'`);
    console.log('Simple Enumeration Output:', simpleOutput);
    
  } catch (error) {
    console.error('Error testing AppleScript:', error);
  }
}

async function testProcessTrackerParser() {
  console.log('\n=== Testing ProcessTracker Parser ===\n');
  
  // Mock output that would come from AppleScript
  const mockOutput = '{sessionId:enhanced-session-1, tty:/dev/ttys002, isProcessing:false}, {sessionId:session-2-1, tty:/dev/ttys003, isProcessing:false}';
  
  console.log('Mock output:', mockOutput);
  
  // Test the parsing logic from ProcessTracker
  function parseSessionStates(output) {
    const states = [];
    const sessionMatches = output.matchAll(/{([^}]+)}/g);
    
    for (const match of sessionMatches) {
      const sessionData = match[1];
      if (!sessionData) continue;
      
      const sessionId = extractValue(sessionData, 'sessionId');
      const tty = extractValue(sessionData, 'tty');
      const isProcessing = extractValue(sessionData, 'isProcessing') === 'true';
      
      if (sessionId && sessionId !== 'missing value') {
        states.push({
          sessionId,
          isProcessing,
          tty: tty !== 'missing value' ? tty : undefined,
          processes: [],
          lastChecked: new Date()
        });
      }
    }
    
    return states;
  }
  
  function extractValue(data, key) {
    const regex = new RegExp(`${key}:([^,}]+)`);
    const match = data.match(regex);
    return match ? match[1]?.trim() : undefined;
  }
  
  const parsed = parseSessionStates(mockOutput);
  console.log('Parsed sessions:', JSON.stringify(parsed, null, 2));
}

// Run tests
testProcessTrackerAppleScript().then(() => {
  return testProcessTrackerParser();
}).catch(console.error);
