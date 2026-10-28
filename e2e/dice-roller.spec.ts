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

test('dice panel builds combined pools and clears history inline', async ({ page }) => {
  await mockApplication(page);
  await page.goto('/');
  await page.getByRole('button', { name: /Otwórz kości|Open dice|Würfel öffnen|Ouvrir les dés/ }).first().click();
  const panel = page.getByRole('complementary', { name: /Kości|Dice|Würfel|Dés/ });
  await panel.getByLabel(/Liczba kości|Number of dice|Anzahl Würfel|Nombre de dés/).first().fill('4');
  await panel.getByRole('spinbutton', { name: /Premia|Bonus/ }).first().fill('1');
  await panel.getByRole('button', { name: /Dodaj grupę kości|Add dice group|Würfelgruppe hinzufügen|Ajouter un groupe de dés/ }).click();
  await panel.getByLabel(/Liczba kości|Number of dice|Anzahl Würfel|Nombre de dés/).nth(1).fill('2');
  await panel.getByLabel(/Kość|Die|Würfel|Dé/, { exact: true }).nth(1).selectOption('2');
  await panel.getByRole('spinbutton', { name: /Premia|Bonus/ }).nth(1).fill('2');
  await panel.getByLabel(/Modyfikator całego rzutu|Whole-roll modifier|Modifikator des gesamten Wurfs|Modificateur du lancer entier/).fill('3');
  await expect(panel.getByText('4(k6+1) + 2(k4+2) + 3', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: /Rzuć|Roll|Würfeln|Lancer/, exact: true }).click();
  await panel.getByRole('button', { name: /Wyczyść historię|Clear history|Verlauf löschen|Effacer l’historique/ }).click();
  await expect(panel.getByText(/Wyczyścić historię rzutów|Clear roll history|Wurfverlauf löschen|Effacer l’historique des lancers/)).toBeVisible();
  await panel.getByRole('button', { name: /Anuluj|Cancel|Abbrechen|Annuler/ }).click();
  await panel.getByRole('button', { name: /Usuń grupę 2|Remove group 2|Gruppe entfernen 2|Supprimer le groupe 2/ }).click();
  await expect(panel.getByLabel(/Liczba kości|Number of dice|Anzahl Würfel|Nombre de dés/)).toHaveCount(1);
  await panel.getByRole('button', { name: /Wyczyść historię|Clear history|Verlauf löschen|Effacer l’historique/ }).click();
  await panel.getByRole('button', { name: /^(Wyczyść|Clear|Löschen|Effacer)$/ }).click();
  await expect(panel.getByText(/Tutaj pojawią się ostatnie rzuty|Recent rolls will appear|Die letzten Würfe|Les derniers lancers/)).toBeVisible();
});
