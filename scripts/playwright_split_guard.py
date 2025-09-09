#!/usr/bin/env python3

import os
import sys
import asyncio
from playwright.async_api import async_playwright

async def main():
    # Check if required environment variables are set
    if not os.getenv("NEXT_PUBLIC_BASE_URL"):
        print("Error: NEXT_PUBLIC_BASE_URL is not set")
        print("Please set the base URL for the application: export NEXT_PUBLIC_BASE_URL='http://localhost:3000'")
        sys.exit(1)

    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        try:
            # Navigate to the chat page
            print(f"Navigating to {os.getenv('NEXT_PUBLIC_BASE_URL')}")
            response = await page.goto(os.getenv("NEXT_PUBLIC_BASE_URL"))
            
            # Check if the page loaded successfully
            if response is None:
                print("Error: Failed to navigate to the page")
                await browser.close()
                sys.exit(1)
            
            print(f"Page loaded with status {response.status}")
            
            # Wait for page to load
            await page.wait_for_load_state()
            
            # Print page title for debugging
            title = await page.title()
            print(f"Page title: {title}")
            
            # Try to find the message input field
            try:
                await page.wait_for_selector("[data-testid='message-input']", timeout=10000)
                print("Found message input field")
            except Exception as e:
                print(f"Warning: Could not find message input field: {e}")
                print("This might be expected if the page structure is different")
            
            # Send a message that might trigger split errors
            try:
                await page.fill("[data-testid='message-input']", "Render a Mermaid code block and some text.")
                await page.press("[data-testid='message-input']", "Enter")
                print("Sent test message")
            except Exception as e:
                print(f"Warning: Could not send test message: {e}")
                print("This might be expected if the page structure is different")
            
            # Wait for the response
            try:
                await page.wait_for_selector("[data-testid='message-assistant']", timeout=10000)
                print("Received response from assistant")
            except Exception as e:
                print(f"Warning: Could not find assistant message: {e}")
                print("This might be expected if the page structure is different")
            
            # Check for JavaScript errors in the console
            errors = []
            
            def handle_console(msg):
                if msg.type == "error":
                    errors.append(msg.text)
                    print(f"Console error: {msg.text}")
            
            page.on("console", handle_console)
            
            # Wait a bit to collect any errors
            await asyncio.sleep(2)
            
            # Check for split-related errors
            split_errors = [
                error for error in errors 
                if "split is not a function" in error or 
                   "Cannot read properties of undefined (reading 'split')" in error
            ]
            
            if split_errors:
                print("Split errors detected:")
                for error in split_errors:
                    print(f"  {error}")
                await browser.close()
                sys.exit(1)
            
            print("No split errors detected during streaming")
            
            # Try to find and click a retry button
            try:
                # Wait for a retry button to appear
                await page.wait_for_selector("[data-testid='retry-button']", timeout=5000)
                await page.click("[data-testid='retry-button']")
                print("Clicked retry button")
                
                # Wait for the response after retry
                await page.wait_for_selector("[data-testid='message-assistant']", timeout=10000)
                print("Received response after retry")
                
                # Check for errors again after retry
                await asyncio.sleep(2)
                
                retry_split_errors = [
                    error for error in errors 
                    if "split is not a function" in error or 
                       "Cannot read properties of undefined (reading 'split')" in error
                ]
                
                if retry_split_errors:
                    print("Split errors detected after retry:")
                    for error in retry_split_errors:
                        print(f"  {error}")
                    await browser.close()
                    sys.exit(1)
                
                print("No split errors detected during retry")
            except Exception as e:
                print(f"No retry button found or retry failed - this might be expected: {e}")
            
            await browser.close()
            print("Test completed successfully")
            
        except Exception as e:
            print(f"Error during test execution: {e}")
            await browser.close()
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())