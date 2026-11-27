import { test, expect, type Locator, type Page } from '@playwright/test';
import { mockApplication, characterId, fixtureCharacter } from './fixtures';
import { CreateDefaultTalent } from '../src/domain/characters/Talent';

async function appendToZero(input: Locator, digit = '5')
{
  await input.fill('0');
  await input.press('End');
  await input.pressSequentially(digit);
  await expect(input).toHaveValue(digit);
}

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  await mockApplication(page, { admin: true });
});
test.afterEach(async ({ page }) => { expect(runtimeErrors.get(page) ?? []).toEqual([]); });

test('maneuver requirement, grade, price and cooldown normalize before submission', async ({ page }) => {
  const submissions: unknown[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/maneuvers' && request.method() === 'POST') submissions.push(request.postDataJSON());
  });
  await page.goto('/compendium/maneuvers');
  await page.getByRole('button', { name: /^dodaj manewr$/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="name"]').fill('Manewr testowy 005');

  for (const field of ['grade', 'price', 'cooldown'])
    await appendToZero(dialog.locator(`input[name="${field}"]`));

  for (const field of ['grade', 'price'])
  {
    const input = dialog.locator(`input[name="${field}"]`);
    await input.fill('');
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.getByText('Uzupełnij pole', { exact: true })).toBeVisible();
    await expect(input).toHaveValue('');
    expect(submissions).toHaveLength(0);
    await input.fill(field === 'price' ? '0' : '5');
  }

  await dialog.getByRole('button', { name: '+ Dodaj wymaganie', exact: true }).click();
  const requirement = dialog.locator('.rounded-md.border.p-3');
  await requirement.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Cecha', exact: true }).click();
  // Select the strength target explicitly, independently of the default order.
  await requirement.getByRole('combobox').nth(1).click();
  await page.getByRole('option', { name: /^siła$/i }).click();
  const rank = requirement.getByRole('spinbutton');
  await appendToZero(rank);
  await rank.fill('0');
  await rank.press('End');
  await rank.press('Backspace');
  await expect(rank).toHaveValue('');
  await rank.pressSequentially('5');
  await expect(rank).toHaveValue('5');
  await rank.pressSequentially('2');
  await expect(rank).toHaveValue('52');
  await rank.fill('0005');
  await expect(rank).toHaveValue('5');
  await rank.fill('00');
  await expect(rank).toHaveValue('0');
  await rank.press('End');
  await rank.pressSequentially('5');
  await expect(rank).toHaveValue('5');

  await rank.fill('');
  await expect(rank).toHaveValue('');
  await dialog.locator('input[name="name"]').click();
  await expect(rank).toHaveValue('');
  await expect(requirement.getByRole('alert')).toHaveText('Uzupełnij pole');
  await dialog.locator('button[type="submit"]').click();
  await expect(requirement.getByRole('alert')).toHaveText('Uzupełnij pole');
  expect(submissions).toHaveLength(0);
  await rank.fill('0');

  const saved = page.waitForRequest(request => new URL(request.url()).pathname === '/api/maneuvers' && request.method() === 'POST');
  await dialog.locator('button[type="submit"]').click();
  expect((await saved).postDataJSON()).toMatchObject({
    name: 'Manewr testowy 005', grade: 5, price: 0, cooldown: 5,
    structuredRequirements: [{ kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 0 }],
  });
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
  const updates: unknown[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname === `/api/characters/${characterId}/combat` && request.method() === 'PUT') updates.push(request.postDataJSON());
  });
  await page.getByRole('button', { name: 'Zapisz', exact: true }).click();
  await expect(page.getByText('Uzupełnij pole', { exact: true })).toBeVisible();
  expect(updates).toHaveLength(0);
  await expect(input).toHaveValue('');
});

test('new talent bonus uses the same formatting and names retain leading zeros', async ({ page }) => {
  await page.goto(`/characters/${characterId}/edit?tab=talents`);
  await page.getByRole('tabpanel').locator('button[data-slot="sheet-trigger"]').click();
  const dialog = page.getByRole('dialog');
  const bonus = dialog.locator('input[name="bonus"]');
  await bonus.fill('0');
  await bonus.press('End');
  await bonus.press('Backspace');
  await expect(bonus).toHaveValue('');
  await bonus.pressSequentially('5');
  await expect(bonus).toHaveValue('5');
  await appendToZero(bonus);
  await bonus.pressSequentially('2');
  await expect(bonus).toHaveValue('52');
  await bonus.fill('');
  await dialog.getByRole('button', { name: 'dodaj umiejętność', exact: true }).click();
  await expect(dialog.getByText('Uzupełnij pole', { exact: true })).toBeVisible();
  await expect(bonus).toHaveValue('');
  await dialog.locator('input[name="name"]').fill('005');
  await expect(dialog.locator('input[name="name"]')).toHaveValue('005');
});

test('AI draft edits reject empty numbers before sending a save request', async ({ page }) => {
  await page.goto('/characters/add');
  await page.getByRole('button', { name: 'Generuj z AI', exact: true }).click();
  await page.getByLabel('Opis postaci', { exact: true }).fill('Strażniczka północnego pogranicza z długim opisem.');
  await page.getByRole('button', { name: /Wygeneruj wersję roboczą|Wczytaj przygotowaną wersję roboczą/ }).click();
  const barrier = page.getByRole('spinbutton', { name: 'bariera', exact: true });
  await expect(barrier).toBeVisible();
  const updates: unknown[] = [];
  page.on('request', request => {
    if (new URL(request.url()).pathname.endsWith('/ai/character-drafts/mobile-draft') && request.method() === 'PATCH') updates.push(request.postDataJSON());
  });
  await barrier.fill('');
  await page.getByRole('button', { name: 'Zapisz zmiany', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Uzupełnij pole' })).toBeVisible();
  await expect(barrier).toHaveValue('');
  expect(updates).toHaveLength(0);
  await barrier.fill('0');
  const saved = page.waitForRequest(request => new URL(request.url()).pathname.endsWith('/ai/character-drafts/mobile-draft') && request.method() === 'PATCH');
  await page.getByRole('button', { name: 'Zapisz zmiany', exact: true }).click();
  expect((await saved).postDataJSON()).toMatchObject({ combat: { health: { barrier: 0 } } });
});

test('manual battle participant dialogs require numbers and preserve cancellation', async ({ page }) => {
  await page.goto('/bestiary/battle');
  await page.getByRole('button', { name: 'Dodaj zewnętrznego uczestnika', exact: true }).click();
  let dialog = page.getByRole('dialog');
  const name = 'Audyt pól liczbowych';
  await dialog.locator('input[id="name"]').fill(name);
  const bonus = dialog.locator('input[id="initiative.value"]');
  await bonus.fill('');
  await dialog.getByRole('button', { name: /^zapisz$/i }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Uzupełnij pole');
  await bonus.fill('0');
  await dialog.getByRole('button', { name: /^zapisz$/i }).click();
  await expect(dialog).toBeHidden();
  const row = page.getByRole('row').filter({ hasText: name });
  await row.getByRole('button', { name: 'Edytuj uczestnika', exact: true }).click();
  dialog = page.getByRole('dialog');
  const health = dialog.locator('input[id="maxHealth"]');
  await health.fill('');
  await dialog.getByRole('button', { name: /^zapisz$/i }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Uzupełnij pole');
  await dialog.getByRole('button', { name: /^anuluj$/i }).click();
  await row.getByRole('button', { name: 'Edytuj uczestnika', exact: true }).click();
  await expect(page.getByRole('dialog').locator('input[id="maxHealth"]')).toHaveValue('50');
});

test('saves the complete talent draft from the toolbar above a filtered list', async ({ page }) => {
  const talents = Array.from({ length: 25 }, (_, i) => ({ ...CreateDefaultTalent(), name: `Talent ${i + 1}`, grade: 3 }));
  await page.route(`**/api/search/${characterId}*`, route => route.fulfill({ json: { ...fixtureCharacter(), talents } }));
  await page.goto(`/characters/${characterId}/edit`);
  await page.getByRole('tab', { name: /^umiejętności$/i }).click();

  const panel = page.getByRole('tabpanel');
  const toolbar = panel.getByRole('group', { name: 'Narzędzia talentów' });
  const save = page.getByRole('button', { name: 'Zapisz', exact: true });
  await expect(save).toBeInViewport();

  const rows = panel.locator('tbody tr');
  await expect.poll(async () => {
    await rows.last().evaluate(row => row.scrollIntoView({ block: 'start' }));
    return rows.count();
  }).toBe(talents.length);
  const row = panel.getByRole('row').filter({ hasText: 'Talent 25' });
  await row.getByRole('cell').nth(1).getByRole('button').first().click();
  await toolbar.getByPlaceholder(/szukaj po nazwie/i).fill('Talent 1');
  await expect(row).toHaveCount(0);
  const submitted = page.waitForRequest(request =>
    new URL(request.url()).pathname === `/api/characters/${characterId}/talents` && request.method() === 'PUT');
  await save.click();
  expect((await submitted).postDataJSON()).toEqual({ talents: talents.map((talent, i) => i === 24 ? { ...talent, grade: 4 } : talent) });
});
