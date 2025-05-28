#!/usr/bin/env node

// Test the parsing logic
const output = "windowId:1, tabId:1, sessionId:missing value, sessionName:missing value, workingDir:missing value, tty:/dev/ttys000, isProcessing:false, windowId:1, tabId:2, sessionId:enhanced-session-1, sessionName:Test Session, workingDir:missing value, tty:/dev/ttys003, isProcessing:false, windowId:1, tabId:3, sessionId:enhanced-session-1, sessionName:Test Session, workingDir:missing value, tty:/dev/ttys004, isProcessing:false, windowId:1, tabId:4, sessionId:enhanced-session-1, sessionName:test-after-restart, workingDir:missing value, tty:/dev/ttys005, isProcessing:false, windowId:1, tabId:5, sessionId:enhanced-session-1, sessionName:test-basic-session, workingDir:missing value, tty:/dev/ttys006, isProcessing:false, windowId:1, tabId:6, sessionId:enhanced-session-2, sessionName:Session 3, workingDir:missing value, tty:/dev/ttys007, isProcessing:false";

function extractValue(data, key) {
  const regex = new RegExp(`${key}:([^,]+)`);
  const match = data.match(regex);
  return match ? match[1]?.trim() : undefined;
}

function parseSessionData(data) {
  const windowId = extractValue(data, 'windowId');
  const tabId = extractValue(data, 'tabId');
  const sessionId = extractValue(data, 'sessionId');
  const sessionName = extractValue(data, 'sessionName');
  const workingDir = extractValue(data, 'workingDir');
  const isProcessing = extractValue(data, 'isProcessing') === 'true';
  
  if (!windowId || !tabId) return null;
  
  // Generate ID if not set
  const id = sessionId && sessionId !== 'missing value' 
    ? sessionId 
    : `session-${windowId}-${tabId}`;
  
  const name = sessionName && sessionName !== 'missing value'
    ? sessionName
    : `Window ${windowId} Tab ${tabId}`;
  
  return {
    id,
    windowId,
    tabId,
    name,
    state: isProcessing ? 'busy' : 'idle',
    workingDir
  };
}

// Split by windowId to separate sessions
const sessionChunks = output.split(/(?=windowId:)/);

console.log('Session chunks:');
sessionChunks.forEach((chunk, i) => {
  if (!chunk.trim()) return;
  console.log(`Chunk ${i}:`, chunk.trim());
  const session = parseSessionData(chunk.trim());
  console.log('Parsed session:', session);
  console.log('---');
});
