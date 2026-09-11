import { randomBytes } from 'node:crypto';
import type { ContactData } from '../types/contact';

export function createContactData(overrides: Partial<ContactData> = {}): ContactData {
  // Contact names accept letters only. Keep the prefix for ownership visibility.
  const suffix = randomBytes(8).toString('hex').replace(/[0-9]/g, digit =>
    String.fromCharCode(103 + Number(digit)),
  );
  const name = `pw${suffix}`;
  return {
    name,
    firstName: 'Alice',
    lastName: 'Example',
    email: `${name}@example.com`,
    country: 'Poland (Polska)',
    callingCode: '+48',
    phoneNumber: '512345678',
    comment: 'Created by automated contact test',
    promotionalEmails: false,
    productEmails: true,
    financialEmails: false,
    ...overrides,
  };
}
