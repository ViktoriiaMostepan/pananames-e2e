import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

export const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

export const baseURL = process.env.BASE_URL || 'https://mcp.pananames-dev.com';

/** Read secrets only when authentication runs; listing tests needs no credentials. */
export function getCredentials(): { email: string; password: string } {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  const missing = [
    !email && 'TEST_USER_EMAIL',
    !password && 'TEST_USER_PASSWORD',
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Populate .env using .env.example.`);
  }

  return { email: email!, password: password! };
}
