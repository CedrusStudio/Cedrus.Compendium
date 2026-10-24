import { test, expect, type Locator } from '@playwright/test';
import { mockApplication, characterId } from './fixtures';

async function appendToZero(input: Locator, digit = '5')
{
  await input.fill('0');
  await input.press('End');
  await input.pressSequentially(digit);
  await expect(input).toHaveValue(digit);
}

test.beforeEach(async ({ page }) => {
  await mockApplication(page, { admin: true });
});

test('maneuver requirement, grade, price and cooldown normalize before submission', async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto('/compendium/maneuvers');
  await page.locator('#add-maneuver-form button').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="name"]').fill('Manewr testowy 005');

  for (const field of ['grade', 'price', 'cooldown'])
    await appendToZero(dialog.locator(`input[name="${field}"]`));

  await dialog.getByRole('button', { name: '+ Dodaj wymaganie', exact: true }).click();
  const requirement = dialog.locator('.rounded-md.border.p-3');
  await requirement.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Cecha', exact: true }).click();
  // Select the strength target explicitly, independently of the default order.
  await requirement.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: /^siła$/i }).click();
  const rank = requirement.getByRole('spinbutton');
  await appendToZero(rank);
  await rank.pressSequentially('2');
  await expect(rank).toHaveValue('52');
  await rank.fill('0005');
  await expect(rank).toHaveValue('5');
  await rank.fill('00');
  await expect(rank).toHaveValue('0');
  await rank.press('End');
  await rank.pressSequentially('5');
  await expect(rank).toHaveValue('5');

  const saved = page.waitForRequest(request => new URL(request.url()).pathname === '/api/maneuvers' && request.method() === 'POST');
  await dialog.locator('button[type="submit"]').click();
  expect((await saved).postDataJSON()).toMatchObject({
    name: 'Manewr testowy 005', grade: 5, price: 5, cooldown: 5,
    structuredRequirements: [{ kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 5 }],
  });
  expect(runtimeErrors).toEqual([]);
});

test('character numeric text preserves the caret, negatives and empty drafts', async ({ page }) => {
  await page.goto(`/characters/${characterId}/edit?tab=combat`);
  const input = page.locator('input[name="health.bonus"]');
  await expect(input).toBeVisible();
  await appendToZero(input);
  await input.press('Home');
  await input.pressSequentially('0');
  await expect(input).toHaveValue('5');
  // The caret stays before 5 when the inserted leading zero is removed.
  await input.pressSequentially('2');
  await expect(input).toHaveValue('25');
  await input.fill('-005');
  await expect(input).toHaveValue('-5');
  await input.fill('00.50');
  await expect(input).toHaveValue('0.50');
  await input.fill('');
  await expect(input).toHaveValue('');
});

test('new talent bonus uses the same formatting and names retain leading zeros', async ({ page }) => {
  await page.goto(`/characters/${characterId}/edit?tab=talents`);
  await page.getByRole('tabpanel').locator('button[data-slot="sheet-trigger"]').click();
  const dialog = page.getByRole('dialog');
  const bonus = dialog.locator('input[name="bonus"]');
  await appendToZero(bonus);
  await bonus.pressSequentially('2');
  await expect(bonus).toHaveValue('52');
  await dialog.locator('input[name="name"]').fill('005');
  await expect(dialog.locator('input[name="name"]')).toHaveValue('005');
});
