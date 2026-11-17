import { test, expect, type Page } from '@playwright/test';
import { mockApplication, fixtureCharacter, characterId, characterName } from './fixtures';
import { expectPageFits } from './layout';
import basics from '../public/data/rulebook/podstawy.json';
import { readdirSync } from 'node:fs';
import { createEmptyProfile } from '../src/common/personalization/personalizationProfile';

const routes = ['/', '/personalization', '/characters', '/characters/favorites', '/characters/add',
  `/characters/${characterId}`, `/characters/${characterId}/edit`, `/characters/${characterId}/sheet`, '/bestiary', '/bestiary/battle',
  '/compendium', '/compendium/equipment',
  ...['maneuvers', 'perks', 'stances', 'states', 'spells', 'powers', 'races'].map(x => `/compendium/${x}`),
  ...['weapons', 'armors', 'shields', 'inventory', 'mounts'].map(x => `/compendium/equipment/${x}`),
  '/rulebook', '/rulebook/search', '/rulebook/podstawy', `/rulebook/podstawy/${basics.sections[0].slug}`,
  '/combat-lab', '/combat-lab/replay', '/combat-lab/report/mobile-fixture', '/admin', '/admin/tags', '/admin/requirements'];

test('every application page has a layout representative', () => {
  const paths = readdirSync('src/app', { recursive: true }).map(String).map(path => path.replaceAll('\\', '/'));
  const missing = paths.filter(path => /(^|\/)page\.tsx$/.test(path)).filter(path => {
    const pattern = '/' + path.replace(/\([^/]+\)\//g, '').replace(/(^|\/)page\.tsx$/, '').replace(/\[[^/]+\]/g, '[^/]+');
    return !routes.some(route => new RegExp(`^${pattern}$`).test(route));
  });
  expect(missing).toEqual([]);
});

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await mockApplication(page);
});
test.afterEach(async ({ page }) => { expect.soft(runtimeErrors.get(page) ?? []).toEqual([]); });

for (const path of routes) {
  test(`layout ${path}`, async ({ page }, testInfo) => {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Application error');
    await expectPageFits(page);
    await page.screenshot({ path: testInfo.outputPath('page.png'), fullPage: true });
  });
}

test('all character tabs and edit forms fit; resize preserves input', async ({ page }, testInfo) => {
  const originalViewport = page.viewportSize()!;
  await page.goto(`/characters/${characterId}`);
  for (const value of ['character', 'combat', 'buffs', 'talents', 'equipment']) {
    const tab = page.getByRole('tab').nth(['character', 'combat', 'buffs', 'talents', 'equipment'].indexOf(value));
    await tab.click();
    await expectPageFits(page);
    await page.screenshot({ path: testInfo.outputPath(`character-${value}.png`), fullPage: true });
  }
  await page.goto(`/characters/${characterId}/edit?tab=character`);
  const input = page.locator('input[name="name"]');
  await input.fill('Niezapisana zmiana na telefonie');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(input).toHaveValue('Niezapisana zmiana na telefonie');
  await expectPageFits(page);
  await page.setViewportSize(originalViewport);
  for (let index = 0; index < 6; index++) {
    await page.getByRole('tab').nth(index).click();
    await expectPageFits(page);
    await page.screenshot({ path: testInfo.outputPath(`edit-${index}.png`), fullPage: true });
  }
});

test('character perks use one mobile column and talent rolls need no horizontal scrolling', async ({ page }, testInfo) => {
  const character = fixtureCharacter();
  const perks = ['Pierwszy atut północnego pogranicza', 'Drugi atut południowej strażnicy'].map((name, index) => ({
    id: `mobile-owned-perk-${index}`, name, grade: 1, price: 1, description: 'Opis posiadanego atutu.', tags: [],
  }));
  const talentName = 'Bardzo długa nazwa umiejętności północnego pogranicza';
  await page.route(`**/api/search/${characterId}*`, route => route.fulfill({ json: {
    ...character, perks, perksIds: perks.map(perk => perk.id),
    talents: [{ ...character.talents[0], name: talentName, grade: 3, bonus: 2 }],
  } }));
  await page.goto(`/characters/${characterId}`);
  const perkList = page.getByRole('list').filter({ has: page.getByText(`${perks[0].name} 1`, { exact: true }) });
  await expect(perkList.locator(':scope > li')).toHaveCount(2);
  const first = await perkList.locator(':scope > li').nth(0).boundingBox();
  const second = await perkList.locator(':scope > li').nth(1).boundingBox();
  const mobile = page.viewportSize()!.width < 640;
  if (mobile) {
    expect(second!.y).toBeGreaterThan(first!.y);
    expect(Math.abs(second!.x - first!.x)).toBeLessThan(1);
  } else expect(Math.abs(second!.y - first!.y)).toBeLessThan(1);
  await page.getByRole('tab').nth(3).click();
  await expect(page.getByRole('columnheader')).toHaveCount(mobile ? 2 : 4);
  await expect(page.getByRole('columnheader', { name: /^rzut$/i })).toBeVisible();
  await expect(page.getByRole('columnheader', { name: /^ranga$/i })).toBeVisible({ visible: !mobile });
  await expect(page.getByRole('columnheader', { name: /^bonus$/i })).toBeVisible({ visible: !mobile });
  const table = page.getByRole('table');
  await expect.poll(() => table.locator('..').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
  const row = page.getByRole('row').filter({ hasText: talentName });
  const rollButton = row.getByRole('button', { name: /^rzut$/i });
  await expect.poll(() => rollButton.evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return bounds.left >= -1 && bounds.right <= document.documentElement.clientWidth + 1;
  })).toBe(true);
  await rollButton.scrollIntoViewIfNeeded();
  await expect(rollButton).toBeInViewport();
  await page.evaluate(() => { Math.random = () => 0.5; });
  await rollButton.click();
  await expect(rollButton).toHaveText('6');
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('talent-roll.png'), fullPage: true });
});

test('character section tabs stay visible without sideways scrolling', async ({ page }, testInfo) => {
  const original = page.viewportSize()!;
  const widths = original.width < 640 ? [320, 360, 390, 430] : [768, 1280, 1440];
  await page.goto(`/characters/${characterId}`);
  const tabs = page.getByRole('tablist');
  await expect(tabs.getByRole('tab')).toHaveCount(5);
  for (const width of widths) {
    await page.setViewportSize({ width, height: original.height });
    await expect.poll(() => tabs.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
    for (let index = 0; index < 5; index++) {
      const tab = tabs.getByRole('tab').nth(index);
      await expect.poll(() => tab.evaluate(element => {
        const parent = element.closest('[role="tablist"]')!.getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        return bounds.left >= parent.left - 1 && bounds.right <= parent.right + 1 && bounds.top >= parent.top - 1 && bounds.bottom <= parent.bottom + 1;
      })).toBe(true);
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator(`[id="${await tab.getAttribute('aria-controls')}"]`)).toBeVisible();
    }
    if (width < 640) {
      const positions = await tabs.getByRole('tab').evaluateAll(elements => elements.map(element => Math.round(element.getBoundingClientRect().top)));
      expect(positions[0]).toBe(positions[2]);
      expect(positions[3]).toBe(positions[4]);
      expect(positions[3]).toBeGreaterThan(positions[0]);
    }
    await expectPageFits(page);
  }
  await page.setViewportSize(original);
  await tabs.getByRole('tab').first().click();
  await page.screenshot({ path: testInfo.outputPath('character-section-tabs.png') });
});

test('character visibility choices fit without horizontal scrolling', async ({ page }, testInfo) => {
  const original = page.viewportSize()!;
  const widths = original.width >= 1024 ? [768, 1024, 1280, 1440, 1920] : [original.width];
  for (const width of widths) {
    await page.setViewportSize({ width, height: original.height });
    for (const path of ['/characters', '/bestiary']) {
      await page.goto(path);
      if (path === '/bestiary' && width < 768) await page.getByRole('button', { name: /^Filtry/ }).click();
      const choices = page.getByRole('tablist').filter({ has: page.getByRole('tab', { name: 'Tylko publiczne', exact: true }) });
      await expect(choices).toBeVisible();
      await expect(choices.getByRole('tab', { name: 'Tylko moje', exact: true })).toBeEnabled();
      await expect.poll(() => choices.evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1);
      for (const name of ['Wszystkie', 'Tylko moje', 'Tylko publiczne']) {
        const tab = choices.getByRole('tab', { name, exact: true });
        await expect.poll(() => tab.evaluate(element => {
          const parent = element.closest('[role="tablist"]')!.getBoundingClientRect();
          const bounds = element.getBoundingClientRect();
          return bounds.left >= parent.left - 1 && bounds.right <= parent.right + 1 && bounds.top >= parent.top - 1 && bounds.bottom <= parent.bottom + 1;
        })).toBe(true);
        await tab.click();
        await expect(tab).toHaveAttribute('aria-selected', 'true');
      }
      await expectPageFits(page);
    }
  }
  await page.goto('/characters');
  await page.screenshot({ path: testInfo.outputPath('character-visibility.png') });
});

test('bestiary mobile filters collapse without losing active choices', async ({ page }, testInfo) => {
  await page.route('**/api/personalization', route => route.fulfill({ json: {
    ...createEmptyProfile(),
    quickTagsByContext: { bestiary: ['wojak', 'nieumarły', 'wynaturzenie', 'dystansowy', 'mag', 'potwory'] },
    quickExcludeTagsByContext: { bestiary: ['walczący-wręcz', 'demon', 'diabeł', 'jeździec'] },
  } }));
  await page.goto('/bestiary');
  const mobile = page.viewportSize()!.width < 768;
  const toggle = page.getByRole('button', { name: /^Filtry/ });
  const visibility = page.getByRole('tab', { name: 'Tylko publiczne', exact: true });
  const quickTag = page.getByText('Szybkie tagi dołączające', { exact: true }).locator('..').getByRole('button', { name: 'wojak', exact: true });
  await expect(page.getByRole('table')).toBeVisible();
  await expect(toggle).toBeVisible({ visible: mobile });
  if (mobile) {
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(visibility).toBeHidden();
    await expect(quickTag).toBeHidden();
    await expect.poll(() => page.getByRole('table').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(280);
    await page.screenshot({ path: testInfo.outputPath('bestiary-filters-collapsed.png') });
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  }
  await expect(visibility).toBeVisible();
  await expect(quickTag).toBeVisible();
  await quickTag.click();
  const filteredRequest = page.waitForRequest(request => {
    if (request.method() !== 'POST' || new URL(request.url()).pathname !== '/api/search') return false;
    const body = request.postDataJSON();
    return body.entity === 'character' && body.characterVisibilityMode === 'publicOnly' && body.search?.tags?.includes('wojak');
  });
  await visibility.click();
  await filteredRequest;
  await expect(visibility).toHaveAttribute('aria-selected', 'true');
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('bestiary-filters-expanded.png') });
  if (mobile) {
    await expect(toggle).toHaveText('Filtry (2)');
    await toggle.click();
    await expect(quickTag).toBeHidden();
    await expect(toggle).toHaveText('Filtry (2)');
    await expect(page.locator('input[name="search"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /^kolumny$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Dodaj zaznaczone do walki', exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(toggle).toBeHidden();
    await expect(visibility).toBeVisible();
    await expect(visibility).toHaveAttribute('aria-selected', 'true');
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(visibility).toBeHidden();
    await toggle.click();
    await expect(visibility).toHaveAttribute('aria-selected', 'true');
    await quickTag.click();
    await expect(toggle).toHaveText('Filtry (1)');
    await visibility.locator('..').getByRole('tab', { name: 'Wszystkie', exact: true }).click();
    await expect(toggle).toHaveText('Filtry');
  }
  await expectPageFits(page);
});

test('compendium rank search stays compact while name search remains wide', async ({ page }, testInfo) => {
  for (const category of ['maneuvers', 'perks', 'stances', 'states', 'spells']) {
    await page.goto(`/compendium/${category}`);
    const rank = page.getByRole('spinbutton', { name: 'ranga', exact: true });
    const name = page.locator('input[name="search"]');
    await expect(rank).toBeVisible();
    await expect.poll(() => rank.evaluate(element => element.getBoundingClientRect().width)).toBeLessThanOrEqual(120);
    await expect.poll(() => rank.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(90);
    await expect.poll(() => name.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(120);
    await rank.click();
    await rank.fill('15');
    await expect(rank).toHaveValue('15');
    await rank.clear();
    await expect(rank).toHaveValue('');
    await expectPageFits(page);
  }
  await page.screenshot({ path: testInfo.outputPath('compact-rank-search.png') });
});

test('category filter stays inside the phone and its only-action needs no hover', async ({ page }) => {
  await page.goto('/compendium/maneuvers');
  await page.getByRole('button', { name: 'Filtruj', exact: true }).click();
  const popover = page.locator('[data-slot="popover-content"]');
  await expect(popover).toBeVisible();
  await expectPageFits(page);
  const bounds = await popover.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await popover.getByRole('button', { name: /Rola/ }).click();
  await popover.getByRole('button', { name: 'tylko', exact: true }).first().click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /Rola:\s*defensywa/ })).toBeVisible();
  await expectPageFits(page);
});

test('rulebook chapters and article anchors work on a phone', async ({ page }) => {
  await page.goto(`/rulebook/podstawy/${basics.sections[0].slug}`);
  const chapterButton = page.getByRole('button', { name: 'Rozdziały podręcznika', exact: true });
  if (await chapterButton.isVisible()) {
    await chapterButton.click();
    await expectPageFits(page);
    await page.getByRole('dialog').getByRole('link').first().click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  const summary = page.locator('summary').filter({ hasText: 'Spis treści' });
  if (await summary.isVisible()) await summary.click();
  await page.getByRole('navigation', { name: 'Spis treści artykułu', exact: true }).getByRole('link').first().click();
  await expect(page).toHaveURL(/#/);
  await expectPageFits(page);
});

test('character scope panel and membership actions work by touch', async ({ page }) => {
  await page.goto('/compendium/perks');
  await page.getByRole('button', { name: 'Wybierz postać', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expectPageFits(page);
  await dialog.getByRole('region', { name: 'Wyszukaj postać' }).getByRole('button', { name: new RegExp(characterName) }).click();
  await expect(dialog).not.toBeVisible();
  const add = page.getByRole('button', { name: /^Dodaj do postaci:/ }).first();
  await add.click();
  const remove = page.getByRole('button', { name: /^Usuń z postaci:/ }).first();
  await expect(remove).toBeEnabled();
  await expectPageFits(page);
  await remove.click();
  await expect(add).toBeEnabled();
});

test('membership failure can be retried; character and owned filter survive reload', async ({ page }) => {
  await page.goto('/compendium/perks');
  await page.getByRole('button', { name: 'Wybierz postać', exact: true }).click();
  await page.getByRole('region', { name: 'Wyszukaj postać' }).getByRole('button', { name: new RegExp(characterName) }).click();
  const membershipUrl = '**/api/characters/*/compendium-memberships/perks/*';
  await page.route(membershipUrl, route => route.fulfill({ status: 500, json: { error: 'Kontrolowany błąd zapisu' } }));
  const add = page.getByRole('button', { name: /^Dodaj do postaci:/ }).first();
  const failed = page.waitForResponse(response => response.url().includes('/compendium-memberships/') && response.status() === 500);
  await add.click();
  await failed;
  await expect(add).toBeEnabled();
  await expect(page.getByRole('button', { name: /^Usuń z postaci:/ })).toHaveCount(0);
  await expectPageFits(page);
  await page.unroute(membershipUrl);
  await add.click();
  await expect(page.getByRole('button', { name: /^Usuń z postaci:/ }).first()).toBeEnabled();
  await page.getByRole('checkbox', { name: 'Tylko posiadane' }).check();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Tylko posiadane' })).toBeChecked();
  await expect(page.getByRole('button', { name: new RegExp(`Postać: ${characterName}`) })).toBeVisible();
  await expectPageFits(page);
});

test('character details can be saved and read again after reload', async ({ page }) => {
  await page.goto(`/characters/${characterId}/edit?tab=character`);
  const name = 'Postać zapisana podczas kontroli mobilnej';
  await page.locator('input[name="name"]').fill(name);
  const [saved] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith(`/characters/${characterId}/details`) && response.request().method() === 'PUT', { timeout: 15_000 }),
    page.getByRole('button', { name: 'Zapisz', exact: true }).click(),
  ]);
  expect(saved.ok()).toBe(true);
  await page.waitForLoadState('networkidle');
  await page.reload();
  await expect(page.locator('input[name="name"]')).toHaveValue(name);
  await expectPageFits(page);
});

test('creation modes, AI proposal and reference panels fit', async ({ page }) => {
  await page.goto('/characters/add');
  await page.getByRole('button', { name: /stwórz na podstawie/ }).click();
  await expectPageFits(page);
  await page.getByRole('button', { name: 'Generuj z AI', exact: true }).click();
  await page.getByLabel('Opis postaci', { exact: true }).fill('Strażniczka północnego pogranicza z bardzo długim opisem.');
  await page.getByRole('button', { name: /Wygeneruj wersję roboczą|Wczytaj przygotowaną wersję roboczą/ }).click();
  await expect(page.getByText('Uzasadnienie modelu', { exact: true })).toBeVisible();
  await expectPageFits(page);
  await page.getByRole('button', { name: 'Zatwierdź i utwórz postać', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/characters/${characterId}/edit\\?tab=character$`));
});

test('every Combat Lab analyzer is reachable and fits', async ({ page }, testInfo) => {
  await page.goto('/combat-lab');
  const mobile = (page.viewportSize()?.width ?? 1440) < 640;
  let labels: string[];
  if (mobile) {
    await page.getByRole('combobox', { name: 'Widok laboratorium' }).click();
    labels = await page.getByRole('option').allTextContents();
    await page.keyboard.press('Escape');
  } else labels = await page.getByRole('tab').allTextContents();
  expect(labels.length).toBeGreaterThanOrEqual(11);
  for (let index = 0; index < labels.length; index++) {
    if (mobile) {
      await page.getByRole('combobox', { name: 'Widok laboratorium' }).click();
      await page.getByRole('option', { name: labels[index], exact: true }).click();
    } else await page.getByRole('tab', { name: labels[index], exact: true }).click();
    await expectPageFits(page);
    await page.screenshot({ path: testInfo.outputPath(`lab-${index}.png`), fullPage: true });
  }
});

test('real simulation worker produces results that fit on a phone', async ({ page }, testInfo) => {
  await page.goto('/combat-lab');
  await page.getByRole('button', { name: characterName, exact: true }).first().click();
  await page.getByRole('button', { name: 'Borowit z Południowej Strażnicy', exact: true }).last().click();
  await page.getByText('Liczba walk', { exact: true }).locator('..').getByRole('spinbutton').fill('5');
  await expectPageFits(page);
  await page.getByRole('button', { name: 'Uruchom symulację', exact: true }).click();
  await expect(page.getByText('Wyniki (5 walk)', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expectPageFits(page);
  await page.getByRole('spinbutton', { name: 'Liczba walk', exact: true }).fill('7');
  await expect(page.getByText('Ustawienia zostały zmienione. Widoczne wyniki dotyczą poprzedniej symulacji.', { exact: true })).toBeVisible();
  await expect(page.getByText('Wyniki (5 walk)', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('simulation-result.png'), fullPage: true });
  const saveRequest = page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname === '/api/combat-lab/simulations');
  await page.getByRole('button', { name: 'Zapisz bieg', exact: true }).click();
  const savedPayload = (await saveRequest).postDataJSON();
  expect(savedPayload.configuration.count).toBe(5);
  expect(savedPayload.result.count).toBe(5);
  await expect(page.getByRole('button', { name: 'Zapisz bieg', exact: true })).toBeDisabled();
  await page.goto('/combat-lab/report/mobile-run');
  await expect(page.getByRole('heading', { name: 'Raport symulacji', exact: true })).toBeVisible();
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('simulation-report.png'), fullPage: true });
});

test('real simulation worker cancels and restarts without a stale result', async ({ page }) => {
  await page.goto('/combat-lab');
  await page.getByRole('button', { name: characterName, exact: true }).first().click();
  await page.getByRole('button', { name: 'Borowit z Południowej Strażnicy', exact: true }).last().click();
  const count = page.getByRole('spinbutton', { name: 'Liczba walk', exact: true });
  await count.fill('100000');
  await page.getByRole('button', { name: 'Uruchom symulację', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Postęp symulacji' })).toBeVisible();
  await page.getByRole('button', { name: 'Anuluj symulację', exact: true }).click();
  await expect(page.getByText('Anulowano symulację.', { exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Wynik zakończonej symulacji' })).toHaveCount(0);
  await count.fill('5');
  await page.getByRole('button', { name: 'Uruchom symulację', exact: true }).click();
  await expect(page.getByText('Wyniki (5 walk)', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Anulowano symulację.', { exact: true })).toHaveCount(0);
  await expectPageFits(page);
});

test('battle participants, column controls and preset dialog work on a phone', async ({ page }) => {
  await page.goto('/bestiary/battle');
  await expect(page.getByRole('button', { name: 'kolumny', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Dodaj zewnętrznego uczestnika', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('#name').fill('Strażnik z bardzo długą nazwą północnego pogranicza');
  await expectPageFits(page);
  await dialog.getByRole('button', { name: 'Zapisz', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Strażnik z bardzo długą nazwą' })).toHaveCount(1);
  await expectPageFits(page);
  await page.getByRole('button', { name: 'zapisz jako nowy', exact: true }).click();
  await page.getByRole('dialog').locator('#battle-preset-name').fill('Mobilna bitwa');
  await page.getByRole('dialog').getByRole('button', { name: 'Zapisz', exact: true }).click();
  await expect(page.locator('#battle-preset-select')).toContainText('Mobilna bitwa');
  await page.getByRole('button', { name: 'wczytaj', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'Strażnik z bardzo długą nazwą' })).toHaveCount(1);
});

test('mobile search header scrolls away so the results remain visible', async ({ page }, testInfo) => {
  test.skip((page.viewportSize()?.width ?? 1440) >= 1024, 'Desktop keeps its sticky header');
  await page.goto('/compendium/perks');
  const header = page.locator('[data-slot="list-header"]').filter({ visible: true });
  await expect(page.getByText('Strażnik Północnego Pogranicza z bardzo długą nazwą 1', { exact: true })).toBeVisible();
  await expect(header).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(async () => (await header.boundingBox())!.y + (await header.boundingBox())!.height).toBeLessThanOrEqual(0);
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('results-after-scroll.png') });
});

test('long admin requirement editor keeps save and close reachable', async ({ page }) => {
  await page.goto('/admin/requirements');
  await page.getByRole('button', { name: 'Edytuj', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  for (let index = 0; index < 4; index++) await dialog.getByRole('button', { name: 'Dodaj kolejne wymaganie (i)', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 390 });
  await expectPageFits(page);
  await expect(dialog.getByRole('button', { name: 'Zapisz', exact: true })).toBeInViewport();
  await dialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
  const close = dialog.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeInViewport();
  await close.click();
  await expect(dialog).not.toBeVisible();
});

test('A4 preview stays local and the print toolbar stays off the PDF', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'PDF generation is a Chromium check');
  await page.goto(`/characters/${characterId}/sheet`);
  await expect(page.locator('.sheet')).toContainText(characterName);
  await expectPageFits(page);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.sheet-toolbar')).not.toBeVisible();
  const pdf = await page.pdf({ path: testInfo.outputPath('character-a4.pdf'), format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(1000);
});

test('tablet, landscape and intermediate phone widths fit', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'phone-390', 'One sweep covers intermediate widths');
  test.setTimeout(180_000);
  for (const size of [{width:360,height:800},{width:430,height:932},{width:844,height:390},{width:768,height:1024},{width:820,height:1180},{width:1280,height:800}]) {
    await page.setViewportSize(size);
    for (const path of ['/compendium/perks', `/characters/${characterId}`, `/rulebook/podstawy/${basics.sections[0].slug}`, '/combat-lab']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expectPageFits(page);
    }
  }
  await page.getByRole('button', { name: 'Switch to jasny' }).click();
  await expect(page.locator('html')).toHaveClass(/light/);
  await expectPageFits(page);
  await page.screenshot({ path: testInfo.outputPath('light-theme.png') });
});

test('API key dialog fits a short screen and returns focus', async ({ page }) => {
  await page.goto('/characters');
  const trigger = page.getByRole('button', { name: 'API Key Set' });
  await trigger.click();
  await page.setViewportSize({ width: 320, height: 390 });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expectPageFits(page);
  const close = dialog.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeInViewport();
  await dialog.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(close).toBeInViewport();
  await close.click();
  await expect(trigger).toBeFocused();
});
