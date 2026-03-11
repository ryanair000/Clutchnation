import { test, expect } from '@playwright/test';

test.describe('Onboarding page', () => {
  // These tests verify the page structure;
  // full onboarding flow requires authentication

  test('onboarding page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/onboarding');
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Matches page', () => {
  test('matches create page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/matches/create');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Messages page', () => {
  test('messages page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/messages');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Settings page', () => {
  test('settings page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Admin page', () => {
  test('admin page redirects non-admin users', async ({ page }) => {
    await page.goto('/admin');
    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/login|banned|dashboard/);
  });
});

test.describe('PSN API endpoints', () => {
  test('PSN lookup returns 401 without auth', async ({ request }) => {
    const response = await request.get('/api/psn/lookup/TestUser');
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.found).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  test('PSN link returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/psn/link', {
      data: { accountId: '123', onlineId: 'test' },
    });
    expect(response.status()).toBe(401);
  });

  test('PSN unlink returns 401 without auth', async ({ request }) => {
    const response = await request.post('/api/psn/unlink');
    expect(response.status()).toBe(401);
  });
});
