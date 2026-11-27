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
    await expect.poll(() => grid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length))
      .toBe(story === "narrow" ? 2 : 4);
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
