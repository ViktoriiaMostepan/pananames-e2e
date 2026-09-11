import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test as setup, expect } from '@playwright/test';
import { authFile, baseURL } from '../../config/env';
import { createAuthenticatedState } from '../../helpers/auth.helper';

// Authentication diagnostics must not capture passwords or session tokens.
setup.use({ trace: 'off', screenshot: 'off', video: 'off' });

setup('authenticate via API with the dev account', async ({ request, browser }) => {
  const state = await createAuthenticatedState(request);
  const context = await browser.newContext({ storageState: state });
  try {
    const page = await context.newPage();
    await page.goto(new URL('/contacts', baseURL).href);
    await expect(page.getByRole('heading', { name: 'Contacts', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Add New Contact', exact: true })).toBeVisible();
    await mkdir(path.dirname(authFile), { recursive: true });
    await context.storageState({ path: authFile });
  } finally {
    await context.close();
  }
});
