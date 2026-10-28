import { expect, test } from '@playwright/test';
import { mockApplication } from './fixtures';

test('dice panel keeps the result across in-app navigation', async ({ page }) => {
  await mockApplication(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Otwórz kości|Open dice|Würfel öffnen|Ouvrir les dés/ }).first().click();
  const panel = page.getByRole('complementary', { name: /Kości|Dice|Würfel|Dés/ });
  await expect(panel).toBeVisible();
  await panel.getByLabel(/Liczba kości|Number of dice|Anzahl Würfel|Nombre de dés/).fill('2');
  await panel.getByRole('button', { name: /Rzuć|Roll|Würfeln|Lancer/, exact: true }).click();
  await expect(panel.locator('button[title*="kość"], button[title*="die"], button[title*="Würfel"], button[title*="dé"]').first()).toBeVisible();
  await panel.getByRole('button', { name: /Zamknij kości|Close dice|Würfel schließen|Fermer les dés/ }).click();
  await page.locator('a[href="/characters"]').first().click();
  await expect(page).toHaveURL(/\/characters/);
  await page.getByRole('button', { name: /Otwórz kości|Open dice|Würfel öffnen|Ouvrir les dés/ }).first().click();
  await expect(panel.getByText(/2k6 \[/)).toBeVisible();
});
