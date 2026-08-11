import { expect, test } from '@playwright/test';

const READING_STATUS_LABELS = ['To Read', 'Reading', 'Paused', 'Finished', 'Did Not Finish'];

async function logInWithDemoAccount(page: import('@playwright/test').Page) {
  await page.goto('/account/login');
  await page.getByRole('button', { name: 'Demo Login' }).click();
  await expect(page).toHaveURL(/\/$/);
}

async function expectEveryReadingStatus(page: import('@playwright/test').Page) {
  for (const label of READING_STATUS_LABELS) {
    await expect(page.getByRole('option', { name: label, exact: true })).toBeVisible();
  }
}

test('status and Edit Book expose the complete reading lifecycle', async ({ page }) => {
  await logInWithDemoAccount(page);
  await page.goto('/books');

  const firstBookHref = await page.locator('[role="listitem"] a').first().getAttribute('href');
  expect(firstBookHref).toBeTruthy();
  await page.goto(firstBookHref!);

  await page.getByRole('button', { name: 'Update Status' }).click();
  const statusDialog = page.getByRole('dialog');
  await expect(statusDialog).toBeVisible();
  await statusDialog.getByRole('combobox', { name: 'Status' }).click();
  await expectEveryReadingStatus(page);
  await page.keyboard.press('Escape');
  await statusDialog.getByRole('button', { name: 'Cancel' }).click();

  await page.getByText('Edit Book', { exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Editing / })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ownership' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Status' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Format' })).toBeVisible();
  await expect(page.getByText('Started', { exact: true })).toBeVisible();

  await page.getByRole('combobox', { name: 'Status' }).click();
  await expectEveryReadingStatus(page);
});
