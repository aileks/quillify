import { expect, test } from '@playwright/test';

async function logInWithDemoAccount(page: import('@playwright/test').Page) {
  await page.goto('/account/login');
  await page.getByRole('button', { name: 'Demo Login' }).click();
  await expect(page).toHaveURL(/\/$/);

  const releaseNotesButton = page.getByRole('button', { name: 'Got It' });
  if (await releaseNotesButton.isVisible()) {
    await releaseNotesButton.click();
  }
}

test('demo account opens the dashboard', async ({ page }) => {
  await logInWithDemoAccount(page);
  await expect(page.getByRole('heading', { name: 'Welcome back, Demo User!' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Library' })).toHaveAttribute('href', '/books');
});

test('authenticated navigation opens About without an account call to action', async ({
  page,
}, testInfo) => {
  await logInWithDemoAccount(page);

  if (testInfo.project.name === 'mobile-chromium') {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.getByRole('link', { name: 'Lists', exact: true })).toBeVisible();
  }

  const aboutLink = page.getByRole('link', { name: 'About', exact: true });
  await aboutLink.click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'A place for books before and after they are read.',
    })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Give each possibility a place.' })
  ).not.toBeVisible();
  await expect(page.getByRole('link', { name: 'Create Account' })).not.toBeVisible();
});

test('authenticated navigation avoids duplicate and background requests', async ({
  context,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Request accounting only needs one browser');

  await logInWithDemoAccount(page);
  await expect(page.getByRole('heading', { name: 'Welcome back, Demo User!' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const requests: Array<{ headers: Record<string, string>; url: string }> = [];
  page.on('request', (request) => {
    requests.push({ headers: request.headers(), url: request.url() });
  });

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back, Demo User!' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requests.filter(({ url }) => url.includes('/api/'))).toEqual([]);

  requests.length = 0;
  await page.goto('/books');
  await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible();
  await expect(page.getByTestId('book-cover-image').first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requests.filter(({ url }) => url.includes('/api/'))).toEqual([]);
  expect(requests.some(({ url }) => url.startsWith('https://covers.openlibrary.org/'))).toBe(true);
  expect(
    requests.some(
      ({ url }) => url.includes('/_next/image') && url.includes('covers.openlibrary.org')
    )
  ).toBe(false);

  requests.length = 0;
  const backgroundPage = await context.newPage();
  await backgroundPage.goto('about:blank');
  await page.bringToFront();
  await page.waitForTimeout(300);
  expect(requests.some(({ url }) => url.includes('/api/auth/session'))).toBe(false);

  requests.length = 0;
  await page.getByRole('link', { name: 'Home', exact: true }).hover();
  await page.waitForTimeout(300);
  expect(requests.some(({ url }) => url.includes('/api/trpc'))).toBe(false);

  requests.length = 0;
  await page.getByRole('searchbox', { name: 'Search books' }).fill('no-match-request-check');
  await expect(page).toHaveURL(/search=no-match-request-check/);
  await expect
    .poll(() => requests.filter(({ url }) => url.includes('/api/trpc/books.list')).length)
    .toBe(1);
  expect(requests.some(({ headers }) => headers.rsc === '1')).toBe(false);
});

test('reading dates use the themed calendar picker', async ({ page }) => {
  await logInWithDemoAccount(page);
  await page.goto('/books/new');
  await page.getByRole('button', { name: 'Enter manually' }).click();
  await page.getByRole('checkbox', { name: 'Add reading details' }).check();

  const startedField = page.locator('[data-slot="form-item"]').filter({ hasText: 'Started' });
  const dateTrigger = startedField.getByRole('button');
  await expect(dateTrigger).toContainText('Pick a date');

  await dateTrigger.click();
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible();

  const today = await page.evaluate(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return {
      dataDay: date.toLocaleDateString(),
      display: `${month}/${day}/${year}`,
    };
  });

  await page.locator(`[data-day="${today.dataDay}"]`).click();
  await expect(dateTrigger).toContainText(today.display);

  await dateTrigger.click();
  await page.getByRole('button', { name: 'Clear date' }).click();
  await expect(dateTrigger).toContainText('Pick a date');
});

test('library, add, and edit layouts stay aligned', async ({ page }, testInfo) => {
  test.setTimeout(60_000);

  const browserRegressions: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (
      text.includes('Hydration failed') ||
      (text.includes('/quill-logo.png') && text.includes('Largest Contentful Paint'))
    ) {
      browserRegressions.push(text);
    }
  });
  page.on('pageerror', (error) => {
    if (error.message.includes('Hydration failed')) {
      browserRegressions.push(error.message);
    }
  });

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
    await library.evaluate((list) => {
      const navigation = document.querySelector('nav[aria-label="Library pagination"]');
      return Boolean(
        navigation && list.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING
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
  await expect(page.getByRole('textbox', { name: 'Search books' })).toBeVisible();
  await page.getByRole('button', { name: 'Enter manually' }).click();
  await expect(page.getByRole('textbox', { name: 'Title' }).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Author' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Pages' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Publication Year' }).first()).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ownership' }).first()).toBeVisible();
  await page.getByRole('checkbox', { name: 'Add reading details' }).check();
  await expect(page.getByRole('combobox', { name: 'Status' }).last()).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Format' })).toBeVisible();

  const genreTrigger = page.getByRole('combobox', { name: 'Genre' }).first();
  const genreBounds = await genreTrigger.boundingBox();
  expect(genreBounds?.width).toBeLessThanOrEqual(250);

  await page.goto(firstBookHref!);
  await expect(page.getByTestId('book-cover-image')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Reading History' })).toBeVisible();
  await page.getByRole('button', { name: /Update Status|Read Again/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page
    .getByRole('article')
    .getByRole('button', { name: /^Edit / })
    .click();
  await expect(page.getByRole('heading', { name: /^Editing / })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Title' }).first()).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Author' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Pages' }).first()).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Publication Year' }).first()).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ownership' }).first()).toBeVisible();

  if (testInfo.project.name === 'chromium') {
    await page.screenshot({ path: 'test-results/audit-edit-book.png', fullPage: true });
  }

  expect(browserRegressions).toEqual([]);
});
