import { expect, test } from '@playwright/test';

test.describe('public experience', () => {
  test('landing page exposes the primary reading-list journey', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
  });

  test('about page explains Quillify and offers account actions', async ({ page }) => {
    await page.goto('/about');

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', {
        level: 1,
        name: 'A focused home for the books you want to read.',
      })
    ).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Simple. Focused. Personal.' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Create Account' })).toHaveAttribute(
      'href',
      '/account/register'
    );
    await expect(main.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/account/login'
    );
  });

  test('login page keeps demo access visible', async ({ page }) => {
    await page.goto('/account/login');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /demo/i })).toBeVisible();
  });
});
