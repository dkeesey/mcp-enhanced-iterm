#!/usr/bin/env node

import { AppleScriptUtils } from './dist/utils/AppleScriptUtils.js';

async function testEnumeration() {
  const script = `
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
    console.log('Testing session enumeration...');
    const result = await AppleScriptUtils.executeScript(script);
    console.log('Raw result:', result);
    
    // Parse the result
    const sessionMatches = result.matchAll(/{([^}]+)}/g);
    const sessions = [];
    
    for (const match of sessionMatches) {
      const sessionData = match[1];
      console.log('Session data:', sessionData);
      sessions.push(sessionData);
    }
    
    console.log(`Found ${sessions.length} sessions`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testEnumeration();
