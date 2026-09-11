import { test as base, expect } from '@playwright/test';
import { ContactsPage } from '../pages/contacts.page';
import { RegisterDomainPage } from '../pages/register-domain.page';
import { CartPage } from '../pages/cart.page';
import { createContactData } from '../test-data/contact.factory';
import type { ContactData } from '../types/contact';

type Fixtures = {
  contactsPage: ContactsPage;
  registerDomainPage: RegisterDomainPage;
  cartPage: CartPage;
  ownedContactNames: Set<string>;
  existingContact: ContactData;
  ownedDomains: Set<string>;
};

export const test = base.extend<Fixtures>({
  contactsPage: async ({ page }, use) => { await use(new ContactsPage(page)); },
  registerDomainPage: async ({ page }, use) => { await use(new RegisterDomainPage(page)); },
  cartPage: async ({ page }, use) => { await use(new CartPage(page)); },

  existingContact: async ({ contactsPage, ownedContactNames }, use) => {
    const contact = createContactData();
    ownedContactNames.add(contact.name);
    await contactsPage.goto();
    await contactsPage.createContact(contact);
    await use(contact);
  },

  ownedContactNames: async ({ contactsPage }, use) => {
    const names = new Set<string>();
    try {
      await use(names);
    } finally {
      const errors: unknown[] = [];
      for (const name of names) {
        try {
          await contactsPage.goto();
          await contactsPage.deleteContactIfExists(name);
        } catch (error) { errors.push(error); }
      }
      if (errors.length) throw new AggregateError(errors, `Contact cleanup failed; inspect owned names: ${[...names].join(', ')}`);
    }
  },

  ownedDomains: async ({ cartPage }, use) => {
    await cartPage.goto();
    expect(await cartPage.getDomainNames(), 'Shared cart must be empty before this test. Existing items will not be removed.').toEqual([]);
    const names = new Set<string>();
    try {
      await use(names);
    } finally {
      const errors: unknown[] = [];
      for (const name of names) {
        try {
          await cartPage.goto();
          await cartPage.removeDomainIfExists(name);
        } catch (error) { errors.push(error); }
      }
      if (names.size && !errors.length) {
        await cartPage.goto();
        const remaining = await cartPage.getDomainNames();
        expect(remaining.filter(name => names.has(name)), 'Owned domains remain after cleanup').toEqual([]);
      }
      if (errors.length) throw new AggregateError(errors, `Cart cleanup failed; inspect owned domains: ${[...names].join(', ')}`);
    }
  },
});

export { expect };
