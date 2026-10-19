import { expect, type Page } from '@playwright/test';

export async function expectPageFits(page: Page) {
  await expect.poll(async () => page.evaluate(() => {
    const root = document.documentElement;
    if (root.scrollWidth <= root.clientWidth + 1) return [];
    const offenders = Array.from(document.querySelectorAll('body *')).filter(element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && style.visibility !== 'hidden' &&
        (rect.right > root.clientWidth + 1 || rect.left < -1) &&
        !element.closest('[data-slot="table-container"], [data-slot="tabs-list"], [data-horizontal-scroll]');
    }).slice(0, 8).map(element => ({
      tag: element.tagName,
      class: element.getAttribute('class'),
      text: element.textContent?.slice(0, 70),
      right: Math.round(element.getBoundingClientRect().right),
    }));
    return [{ documentWidth: root.scrollWidth, viewport: root.clientWidth }, ...offenders];
  }), { message: 'The document must fit the viewport; wide data belongs in local scroll regions' }).toEqual([]);

  await expect.poll(() => page.evaluate(() => {
    const panels = document.querySelectorAll('[data-slot="dialog-content"], [data-slot="sheet-content"], [data-slot="popover-content"], [data-slot="select-content"], [data-slot="alert-dialog-content"]');
    return Array.from(panels).flatMap(panel => {
      const bounds = panel.getBoundingClientRect();
      const visible = bounds.width > 0 && bounds.height > 0 && getComputedStyle(panel).visibility !== 'hidden';
      if (!visible || (bounds.left >= -1 && bounds.top >= -1 && bounds.right <= innerWidth + 1 && bounds.bottom <= innerHeight + 1)) return [];
      return [{ panel: panel.getAttribute('data-slot'), left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom, width: innerWidth, height: innerHeight }];
    });
  }), { message: 'Open panels must fit both the width and height of the viewport' }).toEqual([]);
}
