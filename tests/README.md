# Test Suite Documentation

This directory contains comprehensive test suites for the Ollama Client TypeScript application, covering all critical functionality identified in the architecture analysis.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests (Playwright)
├── unit/                   # Unit and integration tests (Jest)
│   ├── api/               # API route tests
│   ├── components/        # React component tests
│   └── stores/            # State management tests
├── mocks/                 # Mock data and handlers
├── utils/                 # Test utilities and helpers
└── README.md              # This file
```

## Test Categories

### 1. Authentication System Tests
- **Location**: `tests/e2e/auth.spec.ts`
- **Coverage**:
  - Guest user login flow with correct credentials
  - Session persistence and unauthorized access redirects
  - NextAuth integration and JWT handling
  - Form validation and error handling
  - Accessibility compliance

### 2. API Endpoint Tests
- **Location**: `tests/unit/api/`
- **Coverage**:
  - `/api/conversations` - CRUD operations
  - `/api/chat` - streaming and non-streaming responses
  - `/api/models` - Ollama model listing
  - `/api/user/settings` - user preferences
  - Request/response validation and error handling
  - Database integration with Prisma
  - Authentication middleware

### 3. Chat Interface Tests
- **Location**: `tests/unit/components/chat-interface.test.tsx`, `tests/e2e/chat.spec.ts`
- **Coverage**:
  - Message sending and receiving
  - Real-time streaming with cursor animation
  - Request cancellation mid-stream
  - Message formatting and markdown rendering
  - Thinking section parsing and display
  - Error handling and network failures
  - Accessibility features

### 4. Conversation Management Tests
- **Location**: `tests/e2e/conversations.spec.ts`
- **Coverage**:
  - Create, read, update, delete conversations
  - Title auto-generation and editing
  - Model switching per conversation
  - Conversation search and filtering
  - Loading states and error handling

### 5. State Management Tests
- **Location**: `tests/unit/stores/chat-store.test.ts`
- **Coverage**:
  - Zustand store functionality
  - Conversation state updates
  - Model selection persistence
  - Search functionality
  - UI state management (streaming, cancelling, etc.)
  - Settings persistence

### 6. Critical User Journey Tests (E2E)
- **Location**: `tests/e2e/`
- **Coverage**:
  - First-time user complete flow
  - Returning user experience
  - Model switching workflow
  - Conversation management workflow
  - Streaming and cancellation workflow

## Test Technologies

### Jest (Unit/Integration Tests)
- **Framework**: Jest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **Coverage**: Comprehensive code coverage reporting

### Playwright (E2E Tests)
- **Framework**: Playwright for cross-browser testing
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: iOS Safari and Android Chrome simulation
- **Features**: Screenshots, videos, traces on failure

## Running Tests

### Install Dependencies
```bash
bun install
```

### Unit Tests
```bash
# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### E2E Tests
```bash
# Run all E2E tests
bun run test:e2e

# Run E2E tests with UI
bun run test:e2e:ui

# Install Playwright browsers (first time only)
bun playwright install
```

### All Tests
```bash
# Run both unit and E2E tests
bun run test:all
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Next.js integration with `next/jest`
- TypeScript support
- Module path mapping for `@/` imports
- Coverage thresholds (70% minimum)
- Test environment setup

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing
- Local dev server integration
- Retry and timeout settings
- Screenshot and video capture
- Accessibility testing

## Mock Data and Utilities

### Mock Data (`tests/mocks/data.ts`)
- Sample conversations, messages, models
- User settings and authentication data
- API response templates

### Mock Handlers (`tests/mocks/handlers.ts`)
- MSW request handlers for all API endpoints
- Error simulation scenarios
- Streaming response mocking

### Test Utilities (`tests/utils/test-utils.tsx`)
- Custom render function with providers
- Mock store creation helpers
- Common test data generators
- Async operation utilities

## Coverage Requirements

The test suite maintains minimum coverage thresholds:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Data Management

### Database Testing
- Uses SQLite in-memory database for tests
- Prisma schema validation
- Transaction rollback between tests
- Isolated test environments

### External Dependencies
- Ollama server mocked for all tests
- NextAuth providers mocked
- File system operations mocked
- Network requests intercepted

## Accessibility Testing

All tests include accessibility checks:
- ARIA labels and roles
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management

## Performance Testing

E2E tests include performance validations:
- Page load times
- API response times
- Streaming performance
- Memory usage monitoring

## Continuous Integration

Tests are designed to run in CI environments:
- Headless browser execution
- Parallel test execution
- Artifact collection (screenshots, videos)
- Coverage reporting integration

## Debugging Tests

### Jest Tests
```bash
# Debug specific test file
bun run test -- --testNamePattern="specific test name"

# Run tests with verbose output
bun run test -- --verbose

# Debug with Bun debugger
bun --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Tests
```bash
# Debug with Playwright inspector
bun playwright test --debug

# Run specific test file
bun playwright test tests/e2e/auth.spec.ts

# Generate test report
bun playwright show-report
```

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and atomic

### Mock Management
- Use MSW for API mocking
- Reset mocks between tests
- Provide realistic mock data
- Test both success and error scenarios

### Async Testing
- Use proper async/await patterns
- Wait for elements to appear
- Handle loading states
- Test race conditions

### Accessibility
- Include accessibility tests for all components
- Test keyboard navigation
- Verify ARIA attributes
- Check screen reader compatibility

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout values
   - Check for unresolved promises
   - Verify mock responses

2. **Flaky tests**
   - Add proper wait conditions
   - Use deterministic test data
   - Avoid time-dependent assertions

3. **Mock not working**
   - Verify MSW handlers
   - Check request URLs
   - Ensure proper setup/teardown

4. **Coverage issues**
   - Check excluded files
   - Verify test execution
   - Review coverage reports

### Getting Help

- Check test logs for detailed error messages
- Use browser dev tools for E2E debugging
- Review mock network requests
- Consult framework documentation

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add both unit and E2E tests
4. Update mock data as needed
5. Maintain coverage thresholds
6. Document test scenarios