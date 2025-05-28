#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testNewAppleScript() {
  console.log('=== Testing New AppleScript Format ===\n');

  const newScript = `
    tell application "iTerm2"
      set sessionInfoList to {}
      
      repeat with aWindow in windows
        repeat with aTab in tabs of aWindow
          tell current session of aTab
            try
              set sessionId to variable named "user.session_id"
            on error
              set sessionId to missing value
            end try
            
            if sessionId is not missing value then
              -- Format as proper record with curly braces for parsing
              set sessionInfo to "{sessionId:" & sessionId & ", tty:" & tty & ", isProcessing:" & (is processing) & "}"
              set end of sessionInfoList to sessionInfo
            end if
          end tell
        end repeat
      end repeat
      
      -- Join all session info with commas
      set AppleScript's text item delimiters to ", "
      set result to sessionInfoList as string
      set AppleScript's text item delimiters to ""
      return result
    end tell
  `;

  const originalScript = `
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

  try {
    console.log('1. Testing NEW AppleScript...');
    const { stdout: newOutput } = await execAsync(`osascript -e '${newScript}'`);
    console.log('New Output:', newOutput);
    console.log('New Output Length:', newOutput.length);
    console.log('New Raw Output:', JSON.stringify(newOutput));
    
    console.log('\n2. Testing ORIGINAL AppleScript...');
    const { stdout: originalOutput } = await execAsync(`osascript -e '${originalScript}'`);
    console.log('Original Output:', originalOutput);
    console.log('Original Output Length:', originalOutput.length);
    console.log('Original Raw Output:', JSON.stringify(originalOutput));
    
  } catch (error) {
    console.error('Error testing AppleScript:', error);
  }
}

testNewAppleScript();
