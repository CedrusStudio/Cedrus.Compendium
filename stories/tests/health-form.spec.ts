import { expect, test } from "@playwright/test";
import { createRequire } from "node:module";
import path from "node:path";

declare global {
  interface Window { axe: typeof import("axe-core"); }
}

const requirePackage = createRequire(path.resolve("package.json"));
const staticRoot = path.resolve("storybook-static");

test.beforeEach(async ({ page }) => {
  // Serve the static Storybook build to the browser without an extra server or access to the application's API.
  await page.route("http://storybook.test/**", async route => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = path.resolve(staticRoot, "." + pathname);
    if (!file.startsWith(staticRoot + path.sep)) return route.abort();
    await route.fulfill({ path: file });
  });
});

for (const story of ["default", "narrow", "disabled", "dark"]) {
  test(`health form – ${story}`, async ({ page }) => {
    await page.goto(`http://storybook.test/iframe.html?id=characters-health-form--${story}&viewMode=story`);
    const form = page.getByRole("form", { name: "Zdrowie postaci" });
    const input = form.locator('input[name="health.barrier"]');
    await expect(input).toHaveAccessibleName(/.+/);
    const grid = form.locator('[data-slot="card-content"]');
    const title = form.locator('[data-slot="card-title"] span');
    const card = form.locator('[data-slot="card"]');
    const titleBox = (await title.boundingBox())!;
    const cardBox = (await card.boundingBox())!;
    expect(Math.abs(titleBox.x + titleBox.width / 2 - cardBox.x - cardBox.width / 2)).toBeLessThan(1);
    const fields = grid.locator("input");
    await expect(fields).toHaveCount(7);
    const positions = await fields.evaluateAll(inputs => inputs.map(input => input.getBoundingClientRect().top));
    expect(new Set(positions).size).toBe(story === "narrow" ? 4 : 1);
    expect(await grid.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (story === "disabled") await expect(input).toBeDisabled();
    else {
      await form.locator("label").first().click();
      await expect(input).toBeFocused();
      await input.fill("");
      await page.keyboard.press("Tab");
      await expect(input).toHaveAccessibleDescription("Uzupełnij pole");
      await expect(input).toHaveAttribute("aria-invalid", "true");
    }
    await page.addScriptTag({ path: requirePackage.resolve("axe-core/axe.min.js") });
    const violations = await form.evaluate(async el => {
      const result = await window.axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return result.violations.map(({ id, nodes }) => ({ id, elements: nodes.map(node => node.target) }));
    });
    expect(violations).toEqual([]);
    await expect(form).toHaveScreenshot(`health-${story}.png`, { animations: "disabled" });
  });
}

test("the health fields reflow on tablet and mobile viewports", async ({ page }) => {
  await page.goto("http://storybook.test/iframe.html?id=characters-health-form--default&viewMode=story");
  const grid = page.getByRole("form", { name: "Zdrowie postaci" }).locator('[data-slot="card-content"]');
  for (const [width, columns] of [[560, 4], [320, 2]]) {
    await page.setViewportSize({ width, height: 700 });
    await expect.poll(() => grid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(columns);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
