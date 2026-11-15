import { test, expect } from '@playwright/test';
import { mockApplication } from './fixtures';

test('effect JSON blocks stale saves and survives cancelling a type change', async ({ page }) => {
  const errors: string[] = [];
  const submissions: unknown[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (new URL(request.url()).pathname === '/api/maneuvers' && request.method() === 'POST') submissions.push(request.postDataJSON());
  });
  await mockApplication(page, { admin: true });
  await page.goto('/compendium/maneuvers');
  await page.getByRole('button', { name: /^dodaj manewr$/i }).click();
  const editor = page.getByRole('dialog');
  await editor.locator('input[name="name"]').fill('Efekt testowy');
  await editor.getByRole('button', { name: '+ Dodaj efekt', exact: true }).click();
  await editor.getByRole('combobox', { name: 'Typ efektu', exact: true }).click();
  await page.getByRole('option', { name: 'Własny (plugin)', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Zmień typ i usuń pola', exact: true }).click();
  await editor.getByLabel('effectType (klucz pluginu)', { exact: true }).fill('lifesteal');
  const json = editor.getByRole('textbox', { name: 'Dane pluginu (JSON obiektu)', exact: true });
  await json.fill('{"amount":');
  await editor.locator('button[type="submit"]').click();
  await expect(json).toHaveValue('{"amount":');
  await expect(json).toHaveAttribute('aria-invalid', 'true');
  await expect(json).toBeFocused();
  await expect(editor.getByRole('alert').filter({ hasText: 'Niepoprawny JSON' })).toBeVisible();
  await expect(editor.getByRole('status')).toContainText('Podgląd niedostępny');
  expect(submissions).toEqual([]);

  await json.fill('null');
  await editor.locator('button[type="submit"]').click();
  await expect(editor.getByRole('alert').filter({ hasText: 'JSON nie pasuje' })).toBeVisible();
  expect(submissions).toEqual([]);

  await json.fill(' { "amount" : 6 } ');
  await editor.getByRole('combobox', { name: 'Typ efektu', exact: true }).click();
  await page.getByRole('option', { name: 'Odepchnięcie', exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(confirmation.getByRole('button', { name: 'Zachowaj efekt', exact: true })).toBeFocused();
  await confirmation.getByRole('button', { name: 'Zachowaj efekt', exact: true }).click();
  await expect(json).toHaveValue(' { "amount" : 6 } ');
  const saved = page.waitForRequest(request => new URL(request.url()).pathname === '/api/maneuvers' && request.method() === 'POST');
  await editor.locator('button[type="submit"]').click();
  expect((await saved).postDataJSON()).toMatchObject({ effects: [{ type: 'custom', effectType: 'lifesteal', data: { amount: 6 } }] });
  expect(errors).toEqual([]);
});
