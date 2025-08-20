# Jazz Chord App Test Suite

This directory contains a comprehensive test suite for the Jazz Chord Practice App, covering unit tests, integration tests, component tests, performance tests, and accessibility tests.

## Test Organization

```
tests/
├── unit/                     # Unit tests for individual functions
│   ├── chord-generation.test.js   # Chord generation logic
│   └── state-machine.test.js      # Session state management
├── integration/              # API and backend integration tests
│   └── api-endpoints.test.js      # REST API endpoints
├── component/                # UI component tests
│   └── ui-components.test.js      # Frontend UI interactions
├── performance/              # Performance and load tests
│   └── performance.test.js        # Rendering, memory, network
├── accessibility/            # WCAG compliance and a11y tests
│   └── accessibility.test.js     # Keyboard nav, screen readers
├── setup/                    # Test configuration
│   └── jest.setup.js             # Global test setup
└── fixtures/                 # Test data files
```

## Test Categories

### Unit Tests (`tests/unit/`)
Tests individual functions and logic in isolation:
- **Chord Generation**: Random chord creation, validation, filtering
- **State Machine**: Session state transitions, timing calculations
- **Data Validation**: Chord shape verification, user input validation

### Integration Tests (`tests/integration/`)
Tests API endpoints and data flow:
- **Session Data API**: POST `/append-session-data` validation
- **Analysis API**: GET `/analyze-session-data` response format
- **AI Integration**: POST `/send-message` custom queries
- **Error Handling**: Invalid requests, malformed data
- **Performance**: Response times, large datasets

### Component Tests (`tests/component/`)
Tests UI components and user interactions:
- **Timer Display**: Start/stop/reset functionality, time formatting
- **Progress Tracking**: Session iteration display
- **Options Panel**: Key/type/string set selection
- **Problem Display**: Chord information presentation  
- **Results Display**: Copy functionality, keyboard shortcuts
- **Component Integration**: Complete session workflow

### Performance Tests (`tests/performance/`)
Tests app performance under various conditions:
- **Page Load**: Initial load times for both architectures
- **SVG Rendering**: Chord diagram creation speed
- **Memory Usage**: Memory leaks during long sessions
- **Network Efficiency**: Request minimization
- **CSS Performance**: Animation smoothness, layout thrashing

### Accessibility Tests (`tests/accessibility/`)
Tests WCAG compliance and inclusive design:
- **WCAG Compliance**: Automated accessibility scanning
- **Keyboard Navigation**: Tab order, focus management
- **Screen Reader Support**: ARIA labels, announcements
- **Color/Contrast**: High contrast mode, reduced motion
- **Mobile Accessibility**: Touch targets, viewport scaling
- **Focus Management**: Visual indicators, modal behavior

## Running Tests

### Prerequisites
```bash
npm install  # Install all dependencies including test frameworks
```

### Individual Test Suites
```bash
# Unit tests (fast)
npm run test:unit

# Integration tests  
npm run test:integration

# Component tests
npm run test:component

# Performance tests (requires server running)
npm run test:performance

# Accessibility tests (requires server running)
npm run test:accessibility

# E2E tests (existing Playwright tests)
npm run test:e2e
```

### All Tests
```bash
# Run core working test suites (recommended)
npm run test:fast

# Run all test suites including E2E
npm run test:all

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Jest Commands
```bash
# Run all Jest tests
npm test

# Run specific test file
npx jest tests/unit/chord-generation.test.js

# Run tests matching pattern
npx jest --testNamePattern="chord generation"

# Run with verbose output
npx jest --verbose

# Update snapshots
npx jest --updateSnapshot
```

## Test Requirements

### Server Dependencies
Performance and accessibility tests require the server to be running:

```bash
# Terminal 1: Start server
npm run start:refactored

# Terminal 2: Run tests
npm run test:performance
npm run test:accessibility
```

### Browser Dependencies
Some tests use Puppeteer for browser automation. Ensure you have a stable internet connection for browser downloads.

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: JSDOM for frontend tests, Node for backend tests
- **ES Modules**: Full ESM support for modern JavaScript
- **Coverage**: Comprehensive coverage reporting
- **Projects**: Separate configurations for each test type
- **Timeouts**: Extended timeouts for performance/accessibility tests

### Setup Files (`tests/setup/jest.setup.js`)
- **Global Mocks**: Performance API, requestAnimationFrame, observers
- **Console Mocking**: Reduced noise during test runs
- **Cleanup**: Automatic mock clearing between tests

## Writing New Tests

### Unit Test Example
```javascript
import { test, expect, describe } from '@jest/globals';

describe('My Function', () => {
  test('should handle valid input', () => {
    const result = myFunction('valid input');
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example
```javascript
import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<div id="test-element"></div>`);
global.document = dom.window.document;
global.window = dom.window;

test('should update DOM correctly', () => {
  const element = document.getElementById('test-element');
  // Test DOM interactions
});
```

### Integration Test Example
```javascript
import request from 'supertest';

test('should return valid response', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send({ data: 'test' })
    .expect(200);
    
  expect(response.body).toHaveProperty('success');
});
```

## Test Data and Fixtures

### Mock Data
Test fixtures are stored in `tests/fixtures/` for consistent test data across suites.

### Database Mocking
Integration tests use mock responses rather than real database connections to ensure test isolation.

## Continuous Integration

### GitHub Actions
Tests can be integrated into CI/CD pipelines:

```yaml
- name: Run Tests
  run: |
    npm ci
    npm run start:refactored &
    sleep 5
    npm run test:all
```

### Coverage Reports
Coverage reports are generated in `coverage/` directory with HTML and LCOV formats for CI integration.

## Debugging Tests

### Debug Individual Tests
```bash
# Run single test with debugging
node --inspect-brk node_modules/.bin/jest tests/unit/chord-generation.test.js --runInBand

# Debug with VS Code
# Add breakpoints and use "Jest Debug" configuration
```

### Common Issues
1. **Server not running**: Ensure server is started for performance/accessibility tests
2. **DOM environment**: Use JSDOM for tests requiring DOM manipulation
3. **Async operations**: Use proper async/await patterns in tests
4. **Module imports**: Ensure ES module syntax is consistent

## Performance Benchmarks

### Acceptable Thresholds
- **Page Load**: < 3 seconds
- **SVG Rendering**: < 500ms
- **API Response**: < 1 second
- **Memory Growth**: < 50% over session
- **Accessibility Scan**: 0 violations

### Monitoring
Performance tests include specific thresholds that will fail if performance degrades beyond acceptable limits.

## Contributing

When adding new features:
1. Add corresponding unit tests
2. Update component tests if UI changes
3. Add integration tests for new API endpoints
4. Consider performance impact and add performance tests
5. Ensure accessibility compliance

All tests should pass before merging new code.