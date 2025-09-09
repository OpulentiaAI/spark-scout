#!/bin/bash

# Playwright Split Guard Test Script
# This script uses Playwright to test for split errors in the application

# Check if required environment variables are set
if [[ -z "$NEXT_PUBLIC_BASE_URL" ]]; then
    echo "Error: NEXT_PUBLIC_BASE_URL is not set"
    echo "Please set the base URL for the application: export NEXT_PUBLIC_BASE_URL='http://localhost:3000'"
    exit 1
fi

# Activate the virtual environment if it exists
if [[ -d "venv" ]]; then
    source venv/bin/activate
fi

# Run the Playwright Python script
echo "Running Playwright split guard test..."
python3 scripts/playwright_split_guard.py

# Capture the exit code
EXIT_CODE=$?

# Deactivate the virtual environment if it was activated
if [[ -d "venv" ]]; then
    deactivate
fi

# Exit with the same code as the Python script
exit $EXIT_CODE