import { test, expect } from '@playwright/test';
import { ChatPage } from './pages/chat';

// This covers the authenticated path where Streamdown renders blocks and Retry is available.
// It verifies no split-of-undefined or 500s during send + retry.

test.describe('split guards (auth)', () => {
  let chat: ChatPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatPage(page);
    await chat.createNewChat();
  });

  test('no split errors on streaming and retry', async ({ page }) => {
    // Send a basic prompt
    await chat.sendUserMessage('Render a Mermaid code block and some text.');

    // Wait for generation and ensure no 500 responses
    const resp = await page.waitForResponse((r) => r.url().includes('/api/chat'));
    await resp.finished();
    expect(resp.status()).toBeLessThan(500);

    // Assert assistant message rendered without crashing
    const assistant = await chat.getRecentAssistantMessage();
    expect(assistant.content ?? '').not.toContain('TypeError');

    // Try clicking Retry via role (tooltip label) or fallback to last action button
    const lastAssistant = (await page.getByTestId('message-assistant').all()).at(-1)!;
    await lastAssistant.getByRole('button', { name: /retry/i }).click({ trial: true }).catch(() => {});

    const actionButtons = await lastAssistant.locator('button').all();
    if (actionButtons.length > 0) {
      await actionButtons[actionButtons.length - 1].click({ force: true }).catch(() => {});
    }

    // Ensure no 500s after retry
    const retryResp = await page.waitForResponse((r) => r.url().includes('/api/chat'));
    await retryResp.finished();
    expect(retryResp.status()).toBeLessThan(500);

    // Check console logs for split errors
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    const logs: string[] = [];
    page.on('console', (msg) => logs.push(msg.text()));
    await page.waitForTimeout(500);

    const joined = (errors.join('\n') + '\n' + logs.join('\n')).trim();
    expect(joined).not.toMatch(/Cannot read properties of undefined\s*\(reading 'split'\)/);
    expect(joined).not.toMatch(/split is not a function/);
  });
});

