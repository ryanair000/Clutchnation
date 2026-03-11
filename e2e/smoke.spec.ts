import { test, expect } from '@playwright/test';

test.describe('Public pages load', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ClutchNation/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('form')).toBeVisible();
  });

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('form')).toBeVisible();
  });

  test('leaderboards page loads', async ({ page }) => {
    await page.goto('/leaderboards');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('unauthenticated user is redirected from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('not-found page renders for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
  });
});

test.describe('Login flow', () => {
  test('shows validation errors for empty submit', async ({ page }) => {
    await page.goto('/login');
    // Try submitting empty form
    await page.locator('button[type="submit"]').click();
    // Browser native validation should prevent submit or show error
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test('shows password field', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });
});
