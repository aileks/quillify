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

  test('about page explains Quillify philosophy and keeps About in secondary navigation', async ({
    page,
  }, testInfo) => {
    await page.goto('/about');

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', {
        level: 1,
        name: 'A place for books before and after they are read.',
      })
    ).toBeVisible();
    await expect(
      main.getByRole('heading', { name: 'A Library should serve the reading life.' })
    ).toBeVisible();
    await expect(main.getByText(/Quillify is an open-source home/)).toBeVisible();
    await expect(main.getByRole('link', { name: 'View source on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/aileks/quillify'
    );
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
      await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
    } else {
      await expect(page.locator('aside footer').getByRole('link', { name: 'About' })).toBeVisible();
    }
  });

  test('account-required routes redirect signed-out visitors to the landing page', async ({
    page,
  }) => {
    for (const path of ['/books', '/books/new', '/lists']) {
      await page.goto(path);
      await expect(page).toHaveURL('/');
      await expect(page.getByRole('region', { name: 'Hero section' })).toBeVisible();
    }
  });

  test('login page keeps demo access visible', async ({ page }) => {
    await page.goto('/account/login');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /demo/i })).toBeVisible();
  });
});
