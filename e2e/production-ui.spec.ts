import { test, expect, type Page } from '@playwright/test';
import { mockApplication, fixtureCharacter, characterId, characterName } from './fixtures';
import { expectPageFits } from './layout';
import { createEmptyProfile } from '../src/common/personalization/personalizationProfile';
import { CreateDefaultWeapon } from '../src/domain/characters/equipment/Weapon';

test.beforeEach(async ({ page }) => { await mockApplication(page); });

test('character navigation shows progress until the selected character arrives', async ({ page }) => {
  let release = () => {};
  const responseGate = new Promise<void>(resolve => { release = resolve; });
  await page.route(`**/api/search/${characterId}*`, async route => {
    await responseGate;
    await route.fulfill({ json: fixtureCharacter() });
  });
  try {
    await page.goto('/characters');
    await page.getByRole('link', { name: new RegExp(characterName) }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Ładowanie postaci…' })).toBeVisible();
  } finally { release(); }
  await expect(page.locator('[data-slot="character-layout"]')).toBeVisible();
  await expect(page.getByText('Ładowanie postaci…', { exact: true })).toHaveCount(0);
});

test('character sidebar controls and long equipment fit at desktop and tablet widths', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One sweep covers desktop and tablet widths');
  const character = fixtureCharacter();
  const weapon = { ...CreateDefaultWeapon(), id: 'layout-weapon', name: 'Arcymistrzowski łuk Kompozytowy Północnego Pogranicza', description: 'Opis magicznej broni. '.repeat(18) };
  await page.route(`**/api/search/${characterId}*`, route => route.fulfill({ json: {
    ...character, weapons: [weapon], weaponsIds: [weapon.id],
    characteristics: { ...character.characteristics, strength: { ...character.characteristics.strength, grade: 6, value: 123, bonus: 12 } },
  } }));
  await page.goto(`/characters/${characterId}`);
  for (const width of [1024, 1280, 1440, 1920, 768, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const sidebar = page.getByRole('complementary', { name: 'Statystyki postaci' });
    if (width >= 1024) {
      await expect(sidebar).toBeVisible();
      await expect(sidebar.getByText('cechy', { exact: true })).toBeVisible();
      await expect(sidebar.getByText('atrybuty', { exact: true })).toBeVisible();
      const overflow = await sidebar.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        return [...element.querySelectorAll('[data-slot="statistic-row"] button')].some(button => {
          const rect = button.getBoundingClientRect();
          return rect.left < bounds.left - 1 || rect.right > bounds.right + 1;
        });
      });
      expect(overflow).toBe(false);
    }
    await page.getByRole('tab', { name: /^ekwipunek$/i }).click();
    await expect(page.getByText(weapon.name, { exact: true })).toBeVisible();
    await expectPageFits(page);
    await page.screenshot({ path: testInfo.outputPath(`equipment-${width}.png`), fullPage: true });
  }
});

async function expectSheetTablesFit(page: Page) {
  const overflow = await page.locator('.sheet').evaluate(sheet => {
    const bounds = sheet.getBoundingClientRect();
    return [...sheet.querySelectorAll('table, th, td')].filter(element => {
      const rect = element.getBoundingClientRect();
      return rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || element.scrollWidth > element.clientWidth + 1;
    }).map(element => element.textContent);
  });
  expect(overflow).toEqual([]);
}

test('long defense names and all eleven columns fit the A4 preview and printed sheet', async ({ page, browserName }, testInfo) => {
  const character = fixtureCharacter();
  const defenses = ['Brygantyna z Irithium Brontos', 'Królewska Smocza Zbroja i Słońce Valhangar', 'Zbroja ze Skrzydeł Czarnego Smoka'].map((name, index) => ({
    id: `print-defense-${index}`, name, description: '', immunity: 2, resistance: 28,
    protection: 9, block: 14, parry: 14, dodge: 10, bonus: 1,
  }));
  await page.route(`**/api/search/${characterId}*`, route => route.fulfill({ json: {
    ...character, defenses, defaultDefenseId: defenses[0].id,
  } }));
  await page.goto(`/characters/${characterId}/sheet`);
  await expect(page.locator('.sheet-defenses-table tbody tr')).toHaveCount(3);
  await expectSheetTablesFit(page);
  await expectPageFits(page);
  if (browserName !== 'chromium') return;
  await page.emulateMedia({ media: 'print' });
  // A4 minus the two @page 9mm margins, in CSS pixels. Print media alone does not resize the viewport.
  await page.setViewportSize({ width: Math.floor(192 * 96 / 25.4), height: 1054 });
  await expectSheetTablesFit(page);
  await expect(page.locator('.sheet-toolbar')).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath('defenses-a4.png'), fullPage: true });
  const pdf = await page.pdf({ path: testInfo.outputPath('defenses-a4.pdf'), preferCSSPageSize: true, printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
});

test('quick tags share the filter toolbar and collapse without losing selections', async ({ page }, testInfo) => {
  await page.route('**/api/personalization', route => route.fulfill({ json: {
    ...createEmptyProfile(), quickTagsByContext: { bestiary: ['wojak'], maneuvers: ['wojak'] },
    quickExcludeTagsByContext: { bestiary: ['nieumarli'], maneuvers: ['nieumarli'] },
  } }));
  for (const path of ['/bestiary', '/compendium/maneuvers']) {
    await page.goto(path);
    if (path === '/bestiary' && page.viewportSize()!.width < 768) await page.getByRole('button', { name: /^Filtry/ }).click();
    const toggle = page.getByRole('button', { name: 'Szybkie tagi', exact: true });
    await expect(toggle).toBeVisible();
    const panel = page.locator('[data-slot="quick-tags-panel"]');
    await expect(panel).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-controls', await panel.getAttribute('id') ?? '');
    const includedTag = panel.getByRole('button', { name: 'wojak', exact: true });
    const excludedTag = panel.getByRole('button', { name: 'nieumarli', exact: true });
    if (testInfo.project.name === 'desktop') {
      // The bestiary fixture has no categories, so it uses the flat tag picker.
      const filter = path === '/bestiary'
        ? page.getByRole('combobox', { name: 'Dołącz tag', exact: true })
        : page.getByRole('button', { name: 'Filtruj', exact: true });
      await expect(filter).toBeVisible();
      const filterBounds = await filter.boundingBox();
      const tagBounds = await toggle.boundingBox();
      expect(Math.abs(filterBounds!.y - tagBounds!.y)).toBeLessThanOrEqual(4);
    }
    await includedTag.click();
    await excludedTag.click();
    await expect(includedTag).toHaveAttribute('aria-pressed', 'true');
    await expect(excludedTag).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // Active-filter chips outside this panel intentionally remain available.
    await expect(panel).toBeHidden();
    await expect(includedTag).toBeHidden();
    await expect(excludedTag).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await expect(includedTag).toHaveAttribute('aria-pressed', 'true');
    await expect(excludedTag).toHaveAttribute('aria-pressed', 'true');
    await expectPageFits(page);
  }
});
