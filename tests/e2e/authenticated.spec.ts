import { expect, test } from '@playwright/test';

async function logInWithDemoAccount(page: import('@playwright/test').Page) {
  await page.goto('/account/login');
  await page.getByRole('button', { name: 'Demo Login' }).click();
  await expect(page).toHaveURL(/\/$/);
}

test('login announces book cover art', async ({ page }) => {
  await logInWithDemoAccount(page);
  await expect(
    page.getByText('Book cover art is here! Edit a book to find and choose its cover.')
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open your Library' })).toHaveAttribute(
    'href',
    '/books'
  );

  await page.reload();
  await expect(
    page.getByText('Book cover art is here! Edit a book to find and choose its cover.')
  ).not.toBeVisible();
});

test('library, add, and edit layouts stay aligned', async ({ page }, testInfo) => {
  test.setTimeout(60_000);

  await logInWithDemoAccount(page);
  await page.goto('/books');

  await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
  await expect(page.getByTestId('book-cover-image').first()).toBeVisible();
  await expect(page.locator('[role="listitem"]')).toHaveCount(12);
  const firstBookHref = await page.locator('[role="listitem"] a').first().getAttribute('href');
  expect(firstBookHref).toBeTruthy();

  const pagination = page.getByRole('navigation', { name: 'Library pagination' });
  const library = page.getByRole('list', { name: 'Library' });
  await expect(pagination).toBeVisible();
  await expect(library).toBeVisible();
  expect(
    await pagination.evaluate((navigation) => {
      const list = document.querySelector('[role="list"][aria-label="Library"]');
      return Boolean(
        list && navigation.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING
      );
    })
  ).toBe(true);

  const firstCard = page.locator('[role="listitem"] article').first();
  await firstCard.hover();
  await expect(firstCard).toHaveCSS('transform', 'none');

  if (testInfo.project.name === 'chromium') {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: 'test-results/audit-library.png', fullPage: true });

    const logOutButton = page.getByRole('button', { name: 'Log Out' });
    const idleBackground = await logOutButton.evaluate(
      (button) => getComputedStyle(button).backgroundColor
    );
    await logOutButton.hover();
    await expect
      .poll(() => logOutButton.evaluate((button) => getComputedStyle(button).backgroundColor))
      .not.toBe(idleBackground);
    await logOutButton.screenshot({ path: 'test-results/audit-logout-hover.png' });
  }

  await page.goto('/books/new');
  await expect(page.getByRole('heading', { name: 'Add New Book' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title' }).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Author' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Pages' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Publication Year' }).first()).toBeVisible();

  const genreTrigger = page.getByRole('combobox', { name: 'Genre' }).first();
  const genreBounds = await genreTrigger.boundingBox();
  expect(genreBounds?.width).toBeLessThanOrEqual(250);

  await page.goto(firstBookHref!);
  await expect(page.getByTestId('book-cover-image')).toBeVisible();
  await page.getByRole('button', { name: /^Edit / }).click();
  await expect(page.getByRole('heading', { name: /^Editing / })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title' }).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Author' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Pages' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Publication Year' }).first()).toBeVisible();

  if (testInfo.project.name === 'chromium') {
    await page.screenshot({ path: 'test-results/audit-edit-book.png', fullPage: true });
  }
});
