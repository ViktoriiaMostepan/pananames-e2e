import { expect, type APIRequestContext } from '@playwright/test';
import { baseURL, getCredentials } from '../config/env';

type StorageState = Awaited<ReturnType<APIRequestContext['storageState']>>;

export async function createAuthenticatedState(request: APIRequestContext): Promise<StorageState> {
  const { email, password } = getCredentials();
  const csrfResponse = await request.get('/api/sanctum/csrf-cookie');
  expect(csrfResponse.ok(), 'CSRF initialization must succeed').toBe(true);
  const { cookies } = await request.storageState();
  const csrfToken = cookies.find(cookie => cookie.name === 'XSRF-TOKEN');
  expect(!!csrfToken, 'CSRF cookie must be present').toBe(true);

  const loginResponse = await request.post('/api/auth/login', {
    headers: {
      Accept: 'application/json',
      Origin: new URL(baseURL).origin,
      Referer: new URL('/login', baseURL).href,
      'X-XSRF-TOKEN': decodeURIComponent(csrfToken!.value),
    },
    data: { email, password, one_time_password: '' },
  });
  expect(loginResponse.ok(), 'API login must succeed').toBe(true);
  const login = await loginResponse.json();
  expect(!!login.status && !login.error && !login.errors && !login.redirect,
    'Login must complete without errors or an additional authentication step').toBe(true);

  const userResponse = await request.get('/api/user/get', {
    headers: { Accept: 'application/json' },
  });
  expect(userResponse.ok(), 'Authenticated user request must succeed').toBe(true);
  const profile = await userResponse.json();
  expect(!profile.error && !!profile.data?.user, 'Authenticated profile must be available').toBe(true);
  const { user, role, permissions, cart_items_count } = profile.data;

  // Mirror the frontend auth store: route guards need these values as well as cookies.
  const authState = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    balance: parseFloat(user.merchant.balance),
    organization: user.organization,
    error: '',
    loggedIn: true,
    role,
    permissions,
    cartItemsCount: cart_items_count ?? 0,
    agreementStatus: user.merchant.agreement ?? '',
    allowDefaultNs: user.merchant.allow_default_ns ?? 1,
  };
  const state = await request.storageState();
  state.origins = [{
    origin: new URL(baseURL).origin,
    localStorage: Object.entries(authState).map(([key, value]) => ({
      name: `auth.${key}`,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    })),
  }];
  return state;
}
