import { expect, test } from "@playwright/test";
import { mockApplication } from "./fixtures";
import { expectPageFits } from "./layout";

test("inventory search is keyboard accessible and shows empty results on a narrow screen", async ({ page }) =>
{
  await mockApplication(page);
  await page.route("**/api/search", async route =>
  {
    const query = route.request().postDataJSON();
    if (query?.entity !== "inventoryItem") return route.fallback();
    const lantern = { id: "01K7QBNAVF1VY58R2G1ASKYMZK", name: "Latarnia testowa", description: "", tags: [] };
    const name = query.search?.name;
    await route.fulfill({ json: !name || lantern.name.toLowerCase().includes(name.toLowerCase()) ? [lantern] : [] });
  });

  await page.goto("/compendium/equipment/inventory");
  await expect(page.getByText("Latarnia testowa", { exact: true })).toBeVisible();
  const search = page.getByRole("textbox", { name: "Szukaj po nazwie..." });
  await search.focus();
  await expect(search).toBeFocused();
  await page.keyboard.type("brak takiego przedmiotu");
  await expect(page.getByRole("status").filter({ hasText: "nie znaleziono" })).toBeVisible();
  await expect(page.getByText("Latarnia testowa", { exact: true })).toHaveCount(0);
  await search.fill("");
  await expect(page.getByText("Latarnia testowa", { exact: true })).toBeVisible();
  await expectPageFits(page);
});
