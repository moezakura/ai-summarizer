import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://www.inoreader.com/stream/user/1005147396/tag/%E8%89%AF%E3%81%8B%E3%81%A3%E3%81%9F/view/html?cs=m');

  await expect(page).toHaveTitle(/良かった/);
  console.log(page);
});
