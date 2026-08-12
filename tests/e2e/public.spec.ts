import { expect, test } from '@playwright/test';

test.describe('public experience', () => {
  test('landing page exposes the primary reading-list journey', async ({ page }) => {
    await page.goto('/');

    const hero = page.getByRole('region', { name: 'Hero section' });
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Create a Free Account' })).toHaveAttribute(
      'href',
      '/account/register'
    );
    await expect(hero.getByRole('link', { name: 'Sign In' })).toHaveAttribute(
      'href',
      '/account/login'
    );
    await expect(page.locator('footer').getByRole('link', { name: 'About' })).toHaveAttribute(
      'href',
      '/about'
    );
  });

  test('about page explains Quillify and keeps About in secondary navigation', async ({
    page,
  }, testInfo) => {
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

    if (testInfo.project.name === 'mobile-chromium') {
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('menuitem', { name: 'About' })).toBeVisible();
    } else {
      await expect(page.locator('aside footer').getByRole('link', { name: 'About' })).toBeVisible();
    }
  });

  test('login page keeps demo access visible', async ({ page }) => {
    await page.goto('/account/login');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /demo/i })).toBeVisible();
  });
});
