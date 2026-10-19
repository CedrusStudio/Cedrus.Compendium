import { expect, test } from '@playwright/test';
import { characterId, fixtureCharacter, mockApplication } from './fixtures';
import { expectPageFits } from './layout';
import { defaultWeapon, type Weapon } from '../src/domain/characters/equipment/Weapon';

const weapons: Weapon[] = [
  {
    ...defaultWeapon, id: 'layout-bow', name: 'Arcymistrzowski Łuk Kompozytowy', description: '',
    tags: ['łuki', 'dystansowe'], style: 'Dwuręczny', range: 4,
    offense: { amount: 1, grade: 4, bonus: 2, isPhantom: false, critical: { range: 3, power: 4 } },
    damageBonus: { amount: 0, grade: 0, bonus: 0, isPhantom: false },
  },
  {
    ...defaultWeapon, id: 'layout-sword', name: 'Księżyc Valhangar',
    description: 'Fechtunek +1, dodatkowe obrażenia zależą od siły użytkownika. '.repeat(12),
    tags: ['magiczne', 'legendarne'],
    offense: { amount: 2, grade: 5, bonus: 3, isPhantom: true, critical: { range: 2, power: 1 } },
    damageBonus: { amount: 0, grade: 0, bonus: 1, isPhantom: false },
  },
];

test('weapon damage formulas remain readable in equipment and compendium', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await mockApplication(page);
  await page.route(`**/api/search/${characterId}*`, route => route.fulfill({ json: {
    ...fixtureCharacter(), weapons, weaponsIds: weapons.map(weapon => weapon.id),
  } }));
  await page.route('**/api/search', route => route.request().postDataJSON().entity === 'weapon'
    ? route.fulfill({ json: weapons }) : route.fallback());

  const original = page.viewportSize()!;
  const widths = original.width < 640 ? [320, 390] : [640, 768, 1440, 1920];
  for (const path of [`/characters/${characterId}?tab=equipment`, '/compendium/equipment/weapons']) {
    await page.goto(path);
    await expect(page.getByText(weapons[0].name, { exact: true })).toBeVisible();
    for (const width of widths) {
      await page.setViewportSize({ width, height: original.height });
      for (const formula of ['1k8+2', '2(k10w+3)', '+1', '5-8, +4', '8-10, +1']) {
        const text = page.getByText(formula, { exact: true });
        await expect(text).toBeVisible();
        await expect.poll(() => text.evaluate(element => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return new Set(Array.from(range.getClientRects(), rect => Math.round(rect.top))).size;
        }), { message: `${formula} should occupy a single line at ${width}px` }).toBe(1);
        await expect.poll(() => text.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const badge = element.closest('[data-slot="badge"]')!.getBoundingClientRect();
          return bounds.left >= badge.left && bounds.right <= badge.right + 1;
        })).toBe(true);
      }
      await expectPageFits(page);
    }
    await page.screenshot({ path: testInfo.outputPath(path.startsWith('/characters') ? 'equipment.png' : 'compendium-weapons.png') });
  }
  expect(errors).toEqual([]);
});
