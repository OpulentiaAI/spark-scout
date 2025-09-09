# Scrapybara/Playwright Split Guard Test

This test checks for JavaScript split errors in the application, similar to the existing Playwright test in `tests/split-guard.test.ts`.

## Implementation Details

Initially, we tried to use Scrapybara for this test, but found that it's primarily designed for low-level computer automation rather than browser testing. Specifically, it lacks the ability to:
1. Navigate to URLs directly (no `goto` action)
2. Access browser console logs for error detection
3. Handle browser-specific testing scenarios

Therefore, we switched to using Playwright directly, which is better suited for browser testing and provides the necessary features for this task:
1. Direct URL navigation
2. Console log access for error detection
3. Element selection and interaction capabilities

## Prerequisites

1. Install the Playwright CLI: `brew install playwright` (or your preferred installation method)
2. Set your Playwright API key: `export PLAYWRIGHT_API_KEY='your-key'` (if required)
3. Set the base URL for the application: `export NEXT_PUBLIC_BASE_URL='http://localhost:3000'`

## Running the Test

You can run the test using either of these methods:

### Method 1: Using the shell script directly
```bash
bash scripts/scrapybara-split-guard.sh
```

### Method 2: Using the npm script
```bash
npm run test:scrapybara
```

### Method 3: Direct Python execution
```bash
python3 scripts/playwright_split_guard.py
```

## What the Test Does

The test:
1. Starts a Playwright browser instance
2. Navigates to the application URL
3. Waits for key elements to load (with graceful handling if they're not found)
4. Sends a test message that might trigger split errors
5. Monitors browser console logs for JavaScript errors
6. Specifically looks for "split is not a function" or "Cannot read properties of undefined (reading 'split')" errors
7. Attempts to find and click a retry button if available
8. Checks for errors again after retry

## Design Decisions

1. **Graceful Error Handling**: The script handles cases where expected elements (message input, assistant messages, retry buttons) are not found, as this might be expected depending on the application state or page structure.

2. **Console Log Monitoring**: The script monitors browser console logs for JavaScript errors, specifically looking for split-related errors that would indicate the bug we're trying to prevent.

3. **Flexible Execution**: The script can be run in multiple ways to accommodate different workflows and environments.

4. **Clear Reporting**: The script provides clear output about what it's doing and what it finds, making it easy to understand the test results.

## Future Improvements

1. **More Specific Element Selectors**: The current implementation uses generic test IDs (`[data-testid='message-input']`, etc.) that may need to be adjusted based on the actual application structure.

2. **Enhanced Error Detection**: The current implementation looks for specific error messages in console logs. This could be expanded to detect other types of errors or to parse error stack traces for more detailed information.

3. **Parameterized Testing**: The script could be enhanced to accept parameters for different test scenarios or message types.

4. **Integration with CI/CD**: The script could be integrated into automated testing pipelines to run automatically during deployment processes.