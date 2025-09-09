# Scrapybara One-liner CLI Approach

For a quick test without setting up the full script, you can use this one-liner approach:

```bash
# Set your API key and base URL
export SCRAPYBARA_API_KEY='your-api-key'
export NEXT_PUBLIC_BASE_URL='http://localhost:3000'

# Run a simple test using the existing Playwright test
npx playwright test tests/split-guard.test.ts --project=chat

# Or run the Python script directly
python3 scripts/playwright_split_guard.py
```

Note: The Scrapybara SDK is designed for computer automation rather than browser testing, so we've implemented the solution using Playwright directly, which is better suited for this task.