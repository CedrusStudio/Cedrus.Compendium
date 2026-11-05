import { expect, test } from '@playwright/test';
import { characterId, characterName, fixtureCharacter, mockApplication, opponentId } from './fixtures';
import { createEmptyProfile } from '../src/common/personalization/personalizationProfile';
import { expectPageFits } from './layout';

const otherName = 'Borowit z Południowej Strażnicy';

test.beforeEach(async ({ page }) => {
  await mockApplication(page);
  await page.route('**/api/personalization', route => {
    const mainCharacterId = route.request().headers()['x-api-key'] === 'second-key' ? opponentId : characterId;
    return route.fulfill({ json: { ...createEmptyProfile(), mainCharacterId, favoriteCharacterIds: [mainCharacterId] } });
  });
  await page.route(`**/api/search/${opponentId}*`, route => route.fulfill({ json: {
    ...fixtureCharacter(), id: opponentId, name: otherName, shortName: 'Borowit',
  } }));
});

test('main character defaults into scope while manual replacement and clearing survive reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/compendium/perks');
  const main = page.getByRole('button', { name: `Postać: ${characterName}`, exact: true });
  const other = page.getByRole('button', { name: `Postać: ${otherName}`, exact: true });
  await expect(main).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Tylko posiadane' })).not.toBeChecked();
  await main.click();
  await page.getByRole('dialog').getByRole('button', { name: new RegExp(otherName) }).click();
  await expect(other).toBeVisible();
  // Let mocked API responses settle before leaving each document in WebKit.
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(other).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.goto('/compendium/maneuvers');
  await expect(other).toBeVisible();
  await other.click();
  await page.getByRole('button', { name: 'Wyczyść wybór', exact: true }).click();
  const empty = page.getByRole('button', { name: 'Wybierz postać', exact: true });
  await expect(empty).toBeVisible();
  await expect.poll(() => page.evaluate(() => Object.keys(sessionStorage)
    .filter(key => key.startsWith('compendium-character-scope:'))
    .some(key => JSON.parse(sessionStorage.getItem(key)!).explicitlyCleared === true))).toBe(true);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(empty).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Tylko posiadane' })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cedrus-personalization-profiles') ?? '{}')['mobile-e2e-fixture']?.mainCharacterId)).toBe(characterId);
  await expectPageFits(page);
  expect(errors).toEqual([]);
});

test('switching API keys selects the new key main character with no owned filter carried over', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/compendium/perks');
  await expect(page.getByRole('button', { name: `Postać: ${characterName}`, exact: true })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Tylko posiadane' }).check();
  await page.evaluate(() => {
    localStorage.setItem('cedrus-system-api-key', 'second-key');
    window.dispatchEvent(new Event('cedrus-api-key-changed'));
  });
  await expect(page.getByRole('button', { name: `Postać: ${otherName}`, exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Tylko posiadane' })).not.toBeChecked();
  await page.evaluate(() => {
    localStorage.removeItem('cedrus-system-api-key');
    window.dispatchEvent(new Event('cedrus-api-key-changed'));
  });
  await expect(page.getByRole('button', { name: 'Wybierz postać', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Tylko posiadane' })).toHaveCount(0);
  await expectPageFits(page);
  expect(errors).toEqual([]);
});

test('scope picker offers direct main and favorite shortcuts after clearing', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/personalization', route => route.fulfill({ json: {
    ...createEmptyProfile(), mainCharacterId: characterId, favoriteCharacterIds: [characterId, opponentId],
  } }));
  await page.goto('/compendium/perks');
  const mainScope = page.getByRole('button', { name: `Postać: ${characterName}`, exact: true });
  await mainScope.click();
  await page.getByRole('button', { name: 'Wyczyść wybór', exact: true }).click();
  await page.getByRole('button', { name: 'Wybierz postać', exact: true }).click();
  const main = page.getByRole('region', { name: 'Główna postać', exact: true });
  const favorites = page.getByRole('region', { name: 'Ulubione postacie', exact: true });
  await expect(main.getByRole('button', { name: characterName })).toBeVisible();
  await expect(favorites.getByRole('button', { name: characterName })).toHaveCount(0);
  await expect(favorites.getByRole('button', { name: otherName })).toBeVisible();
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('scope-shortcuts.png') });
  await favorites.getByRole('button', { name: otherName }).click();
  const otherScope = page.getByRole('button', { name: `Postać: ${otherName}`, exact: true });
  await expect(otherScope).toBeVisible();
  await expect(page.getByRole('dialog')).toBeHidden();
  await otherScope.click();
  await expect(favorites.getByRole('button', { name: otherName })).toHaveAttribute('aria-pressed', 'true');
  await main.getByRole('button', { name: characterName }).click();
  await expect(mainScope).toBeVisible();
  expect(errors).toEqual([]);
});
