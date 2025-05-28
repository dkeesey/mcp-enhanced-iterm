#!/usr/bin/env node

import { AppleScriptUtils } from './dist/utils/AppleScriptUtils.js';

async function testWriteToSession() {
  console.log('Testing AppleScriptUtils writeToSession...');
  
  const script = `
    tell application "iTerm2"
      repeat with aWindow in windows
        repeat with aTab in tabs of aWindow
          tell current session of aTab
            try
              if (variable named "user.session_id") is "${AppleScriptUtils.escapeString('enhanced-session-3')}" then
                write text "${AppleScriptUtils.escapeString('echo "TEST: AppleScriptUtils working"')}"
                return "written"
              end if
            end try
          end tell
        end repeat
      end repeat
      return "not found"
    end tell
  `;

  try {
    console.log('Executing script:', script);
    const result = await AppleScriptUtils.executeScript(script);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testWriteToSession();
