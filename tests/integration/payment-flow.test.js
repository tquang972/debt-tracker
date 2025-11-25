// Integration test for payment flow UI using Playwright (or Puppeteer)
// This is a placeholder test that can be run in CI.
// It opens the app, makes a payment, and verifies the payment appears in History.

import { test, expect } from '@playwright/test';

test('Payment flow adds payment and updates history', async ({ page }) => {
    // Open the app
    await page.goto('https://tquang972.github.io/debt-tracker/?debug=true');

    // Wait for debts to load
    await page.waitForSelector('.debt-item');

    // Click the first pay button
    const payBtn = await page.$('.pay-btn');
    await payBtn.click();

    // Fill the form
    await page.fill('input[name="amount"]', '5');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.click('#cancelPayBtn'); // close modal to test cancel

    // Re-open and submit
    await payBtn.click();
    await page.fill('input[name="amount"]', '5');
    await page.fill('input[name="date"]', new Date().toISOString().split('T')[0]);
    await page.click('button[type="submit"]');

    // Verify payment appears in History
    await page.click('.nav-item[data-view="history"]');
    await page.waitForSelector('.history-item');
    const historyItems = await page.$$('.history-item');
    expect(historyItems.length).toBeGreaterThan(0);
});
