import { expect, test } from '@playwright/test';
import { characterId, characterName, fixtureCharacter, mockApplication } from './fixtures';

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

test('the shared save icon beside Back submits only the active character section', async ({ page }) => {
  await mockApplication(page);
  const character = { ...fixtureCharacter(), maneuvers: [], maneuversIds: [] };
  await page.route(`**/api/search/${characterId}*`, route => route.fulfill({ json: character }));
  await page.goto(`/characters/${characterId}/edit`);

  const tabs = [
    [/^statystyki$/i, 'statistics'], [/^postać$/i, 'details'], [/^walka$/i, 'combat'],
    [/^wzmocnienia$/i, 'buffs'], [/^umiejętności$/i, 'talents'], [/^ekwipunek$/i, 'equipment'],
  ] as const;
  const save = page.getByRole('button', { name: 'Zapisz', exact: true });
  const back = page.getByRole('link', { name: 'Cofnij', exact: true });
  for (const [name, section] of tabs) {
    await page.getByRole('tab', { name }).click();
    const panel = page.getByRole('tabpanel');
    await expect(save).toHaveCount(1);
    await expect(panel.getByRole('button', { name: 'Zapisz', exact: true })).toHaveCount(0);
    await expect(save).toBeInViewport();
    await expect(back).toBeInViewport();
    const saveBox = (await save.boundingBox())!, backBox = (await back.boundingBox())!;
    expect(Math.abs(saveBox.y - backBox.y)).toBeLessThan(2);
    expect(backBox.x - saveBox.x - saveBox.width).toBeCloseTo(8, 0);
    await expect(back).toHaveAttribute('href', `/characters/${characterId}?tab=${section === 'details' ? 'character' : section}`);
    await expect(save.locator('svg.lucide-save')).toHaveCount(1);
    expect(await save.evaluate(button => (button as HTMLButtonElement).form === document.querySelector('[role="tabpanel"][data-state="active"] form'))).toBe(true);
    await save.hover();
    await save.focus();
    expect(await save.getAttribute('title')).toBeNull();
    expect(await save.getAttribute('aria-describedby')).toBeNull();
    await expect(page.getByRole('tooltip')).toHaveCount(0);

    const url = `/api/characters/${characterId}/${section}`;
    const { promise: release, resolve: finish } = Promise.withResolvers<void>();
    await page.route(`**${url}`, async route => {
      await release;
      await route.fallback();
    }, { times: 1 });
    try {
      const request = page.waitForRequest(request => request.method() === 'PUT');
      await save.press('Enter');
      expect(new URL((await request).url()).pathname).toBe(url);
      const saving = page.getByRole('button', { name: 'Zapisuję...' });
      await expect(saving).toBeDisabled();
      if (section === 'statistics') {
        await page.getByRole('tab', { name: /^postać$/i }).click();
        await expect(save).toBeEnabled();
        await page.getByRole('tab', { name }).click();
        await expect(saving).toBeDisabled();
      }
    } finally {
      finish();
    }
    await expect(save).toBeEnabled();
  }
  await back.click();
  await expect(page).toHaveURL(`/characters/${characterId}?tab=equipment`);
});
