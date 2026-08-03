import { expect, test } from '@playwright/test';

test.describe('public experience', () => {
  test('landing page exposes the primary reading-list journey', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
  });

  test('login page keeps demo access visible', async ({ page }) => {
    await page.goto('/account/login');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /demo/i })).toBeVisible();
  });
});
