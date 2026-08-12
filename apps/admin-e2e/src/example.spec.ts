import { test, expect } from '@playwright/test';

test('renders the admin dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Signups' })).toBeVisible();
  await expect(page.getByText('Storage used')).toBeVisible();
});
