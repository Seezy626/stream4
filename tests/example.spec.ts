import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Movie Tracker/);
});

test('search functionality', async ({ page }) => {
  await page.goto('/');

  // Test that the search bar is present
  await expect(page.locator('input[placeholder="Search for movies..."]')).toBeVisible();

  // Test that search button is present
  await expect(page.locator('button:has-text("Search")')).toBeVisible();
});

test('movie cards display correctly', async ({ page }) => {
  await page.goto('/');

  // The page should have the movie tracker heading
  await expect(page.locator('h1:has-text("Movie Tracker")')).toBeVisible();
});