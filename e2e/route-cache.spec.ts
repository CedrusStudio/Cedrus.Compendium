import { expect, test } from '@playwright/test';

test('resolves admin capability and personalization access for each API request', async ({ page }) => {
  // These two endpoints exercise header-based access without reading a personal profile or writing to the database.
  for (const [apiKey, isAdmin] of [['', false], ['mobile-e2e-fixture', true], ['unknown', false]] as const) {
    await page.setExtraHTTPHeaders(apiKey ? { 'x-api-key': apiKey } : {});
    const response = await page.goto('/api/admin/capabilities');
    expect(response?.status()).toBe(200);
    expect(await response?.json()).toEqual({ isAdmin });
  }
  for (const [apiKey, status] of [['', 401], ['unknown', 403]] as const) {
    await page.setExtraHTTPHeaders(apiKey ? { 'x-api-key': apiKey } : {});
    expect((await page.goto('/api/personalization'))?.status()).toBe(status);
  }
});
