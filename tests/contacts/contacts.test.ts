import { test, expect } from '../../fixtures/test.fixture';
import { createContactData } from '../../test-data/contact.factory';
import { expectSavedContact } from '../../helpers/contact.assertions';

test.describe('Contacts', () => {
  test('creates a contact and persists all fields and email preferences', async ({ contactsPage, ownedContactNames }) => {
    const data = createContactData();
    ownedContactNames.add(data.name);
    await contactsPage.goto();
    await contactsPage.createContact(data);

    await contactsPage.goto();
    await contactsPage.openContact(data.name);
    await expectSavedContact(contactsPage.form, data);
  });

  test('edits a contact and persists updated fields and email preferences', async ({ contactsPage, ownedContactNames, existingContact: original }) => {
    const changed = createContactData({
      firstName: 'Bob',
      lastName: 'Sample',
      country: 'Germany (Deutschland)',
      callingCode: '+49',
      phoneNumber: '15123456789',
      comment: 'Updated by automated contact test',
      promotionalEmails: !original.promotionalEmails,
      productEmails: !original.productEmails,
      financialEmails: !original.financialEmails,
    });
    ownedContactNames.add(changed.name);
    await contactsPage.editContact(original.name, changed);
    await contactsPage.goto();
    expect(await contactsPage.hasContact(original.name)).toBe(false);
    await contactsPage.openContact(changed.name);
    await expectSavedContact(contactsPage.form, changed);

  });

  test('deletes an independently created contact', async ({ contactsPage, existingContact: contact }) => {
    expect(await contactsPage.hasContact(contact.name)).toBe(true);
    await contactsPage.deleteContact(contact.name);
    await contactsPage.goto();
    expect(await contactsPage.hasContact(contact.name)).toBe(false);
  });
});
