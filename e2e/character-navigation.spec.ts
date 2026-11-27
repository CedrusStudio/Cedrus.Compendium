import { expect, test } from '@playwright/test';
import { characterId, characterName, mockApplication } from './fixtures';

test('opens a character from the keyboard and returns to the list', async ({ page }) => {
  await mockApplication(page);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/characters');
  const link = page.locator(`a[href="/characters/${characterId}"]`).filter({ hasText: characterName });
  if (process.env.E2E_PRODUCTION === '1') {
    const prefetch = page.waitForRequest(request =>
      new URL(request.url()).pathname === `/characters/${characterId}` &&
      request.headers()['next-router-prefetch'] === '1');
    await Promise.all([prefetch, link.focus()]);
  } else {
    await link.focus();
  }
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/characters/${characterId}$`));
  await expect(page.getByRole('heading', { level: 1, name: characterName })).toBeVisible();
  await page.goBack();
  await expect(link).toBeVisible();
  expect(errors).toEqual([]);
});
