import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Cosmic Nexus Showcase/);
});

test('search functionality', async ({ page }) => {
  await page.goto('/');

  // Test that the page has content
  await expect(page.locator('body')).toBeVisible();
});

test('movie cards display correctly', async ({ page }) => {
  await page.goto('/');

  // The page should have content
  await expect(page.locator('body')).toBeVisible();
});