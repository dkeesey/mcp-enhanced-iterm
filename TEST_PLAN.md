# Enhanced iTerm MCP - Test Plan

## Overview
This test plan outlines the strategy for achieving comprehensive test coverage of the Enhanced iTerm MCP system, with a focus on using VS Code MCP integration and Qodo for automated test generation.

## Current State
- **Test Framework**: Vitest (already configured)
- **Coverage Tool**: Vitest coverage
- **Existing Tests**: 1 test file (SessionManager.test.ts)
- **Test Scripts**: `npm test`, `npm run test:ui`, `npm run test:coverage`

## Testing Priorities

### 🔴 Critical (Must Test First)
1. **CommandExecutor** - Core iTerm interaction layer
2. **ProcessTracker** - Process lifecycle management  
3. **SafetyTiers** - Security-critical component
4. **ErrorRecovery** - System reliability

### 🟡 Important (Test Second)
5. **SessionManager** - Session lifecycle management
6. **TaskDistributor** - Task coordination logic
7. **ProgressAggregator** - Result collection
8. **ClaudeCodeIntegration** - Claude CLI integration

### 🟢 Nice to Have (Test Later)
9. **PerformanceMonitor** - Performance tracking
10. **WaltOpieValidation** - Validation framework

## Testing Strategy

### Phase 1: Setup VS Code MCP
- Install VS Code MCP server
- Configure Qodo extension for test generation
- Verify Claude can interact with VS Code

### Phase 2: Unit Tests (Using Qodo)
For each component:
1. Use Qodo to analyze code and suggest test cases
2. Generate comprehensive unit tests with mocks
3. Focus on:
   - Happy path scenarios
   - Error handling
   - Edge cases
   - Security vulnerabilities

### Phase 3: Integration Tests
- Test MCP tool handlers end-to-end
- Test component interactions
- Validate request/response cycles

### Phase 4: Performance Tests
- Load testing with multiple sessions
- Resource usage validation
- Performance monitoring accuracy

## Key Testing Patterns

### Mocking Strategy
```typescript
// Mock AppleScript execution
vi.mock('child_process', () => ({
  execSync: vi.fn().mockReturnValue('mocked output')
}));

// Mock file system operations
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn()
}));
```

### Test Structure
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const component = new Component();
      
      // Act
      const result = await component.method();
      
      // Assert
      expect(result).toBeDefined();
    });
    
    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

## Coverage Goals
- **Target**: 80% code coverage minimum
- **Critical Components**: 90%+ coverage
- **Focus Areas**:
  - Error handling paths
  - Security validations
  - State management
  - Async operations

## Test Data Requirements
- Mock AppleScript responses
- Sample session states
- Error scenarios
- Performance metrics

## CI/CD Integration
- Run tests on every commit
- Block merges if tests fail
- Generate coverage reports
- Monitor test performance

## Next Steps
1. Install VS Code MCP server
2. Configure Qodo for test generation
3. Start with CommandExecutor tests
4. Progressively add tests for each component
5. Set up continuous testing workflow

## Success Criteria
- All critical components have >90% coverage
- All tests pass consistently
- Performance tests validate 10+ session handling
- Security tests validate all safety tiers
- Integration tests cover all 32 MCP tools