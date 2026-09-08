# TAXCUNPAM Quiz System Test Suite

This directory contains standalone automated test scripts to verify backend API endpoints, authentication flows, session recovery, timer sync, anti-cheat violation logging, and submission mechanics.

## Requirements

- Node.js (v18+ with native `fetch` support)
- Running Backend Server (default target: `http://localhost:3000`)

## Running Tests

### 1. Run All Tests
To run the full test suite in sequence:
```bash
node tests/test-runner.js
```

### 2. Run Individual Tests

#### Test Login & Token Validation
Tests uppercase/lowercase token input, invalid tokens, and used token blocking:
```bash
node tests/test-login.js
```

#### Test Full Quiz Flow
Tests fetching questions, retrieving quiz info, autosaving answers, recovering answers, and submitting:
```bash
node tests/test-quiz-flow.js
```

#### Test Anti-Cheat Violations
Tests violation logging (`tab_switch`, `fullscreen_exit`, `devtools`) and threshold checks:
```bash
node tests/test-violations.js
```

## Custom Target URL
You can specify a custom API URL using the `API_URL` environment variable:
```bash
API_URL=http://localhost:3000/api node tests/test-runner.js
```
