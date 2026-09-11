import { expect, type Locator, type Page } from '@playwright/test';
import { ContactFormComponent } from '../components/contact-form.component';
import type { ContactData } from '../types/contact';
import { step } from '../utils/step';
import { BasePage } from './base.page';

export class ContactsPage extends BasePage {
  readonly form: ContactFormComponent;

  readonly heading = {
    contacts: this.page.getByRole('heading', { name: 'Contacts', exact: true }),
    createContact: this.page.getByRole('heading', { name: 'Create new contact', exact: true }),
    editContact: this.page.getByRole('heading', { name: 'Edit contact', exact: true }),
  };

  readonly button = {
    addContact: this.page.getByRole('button', { name: '+ Add New Contact', exact: true }),
    create: this.page.getByRole('button', { name: 'Create', exact: true }),
    save: this.page.getByRole('button', { name: 'Save', exact: true }),
    pagination: this.page.getByRole('button', { name: /^go to the \d+ page$/i }),
    pageByLabel: (label: string): Locator => this.page.getByRole('button', { name: label, exact: true }),
  };

  readonly table = {
    body: this.page.locator('tbody'),
    headers: this.page.getByRole('columnheader'),
    nameHeader: this.page.getByRole('columnheader', { name: 'Name', exact: true }),
    firstContactName: this.page.locator('tbody strong').first(),
  };

  readonly row = {
    contact: (name: string): Locator => this.page.getByRole('row').filter({
      has: this.page.getByText(name, { exact: true }),
    }),
  };

  readonly label = {
    loading: this.page.getByText('rotate_left', { exact: true }),
  };

  readonly dialog = {
    deleteContact: this.page.getByRole('dialog'),
  };

  constructor(page: Page) {
    super(page);
    this.form = new ContactFormComponent(page);
  }

  @step()
  async goto(): Promise<void> {
    await this.loadList(() => this.page.goto('/contacts'));
  }

  private async loadList(action: () => Promise<unknown>): Promise<void> {
    // Observe the UI's request; do not mistake a loading row for loaded contacts.
    const [response] = await Promise.all([
      this.page.waitForResponse(response => new URL(response.url()).pathname === '/api/contacts'
        && response.request().method() === 'GET'),
      action(),
    ]);
    if (!response.ok()) throw new Error(`Contacts list request failed: ${response.status()}`);
    await response.finished();
    await this.waitForList();
  }

  private async waitForList(): Promise<void> {
    await expect(this.heading.contacts).toBeVisible();
    await expect(this.table.nameHeader).toBeVisible();
    await expect(this.table.firstContactName).toBeVisible();
    await expect(this.label.loading).toBeHidden();
  }

  /** Re-read page controls after each transition, including newly revealed numbers. */
  private async findContact(name: string): Promise<Locator | undefined> {
    await this.waitForList();
    const visited = new Set<string>();
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await this.row.contact(name).count()) return this.row.contact(name);
      // aria-current belongs to the button itself, not a child element.
      const labels = await this.button.pagination.evaluateAll(buttons => buttons.map(button => ({
        label: button.getAttribute('aria-label') || '',
        current: button.getAttribute('aria-current') === 'true',
      })));
      for (const item of labels) if (item.current) visited.add(item.label);
      const label = labels.find(item => item.label && !visited.has(item.label))?.label;
      if (!label) return undefined;
      const before = await this.table.body.innerText();
      const button = this.button.pageByLabel(label);
      await button.click();
      await expect(button).toHaveAttribute('aria-current', 'true');
      await expect.poll(() => this.table.body.innerText()).not.toBe(before);
      await this.waitForList();
      visited.add(label);
    }
    throw new Error('Contact lookup exceeded 100 pages; cleanup cannot be confirmed.');
  }

  async hasContact(name: string): Promise<boolean> {
    return Boolean(await this.findContact(name));
  }

  @step()
  async createContact(data: ContactData): Promise<void> {
    await this.button.addContact.click();
    await expect(this.heading.createContact).toBeVisible();
    await this.form.fill(data);
    await this.loadList(() => this.button.create.click());
  }

  private async clickContactAction(row: Locator, action: 'Edit' | 'Delete'): Promise<void> {
    const headers = await this.table.headers.allTextContents();
    const columnIndex = headers.findIndex(header => header.trim() === action);
    if (columnIndex < 0) throw new Error(`Contacts table has no ${action} column.`);
    await row.getByRole('cell').nth(columnIndex).getByRole('button').click();
  }

  @step()
  async openContact(name: string): Promise<void> {
    const row = await this.findContact(name);
    if (!row) throw new Error(`Contact "${name}" was not found in the contacts list.`);
    await this.clickContactAction(row, 'Edit');
    await expect(this.heading.editContact).toBeVisible();
    await expect(this.form.input.name).toHaveValue(name);
  }

  @step()
  async editContact(name: string, data: ContactData): Promise<void> {
    await this.openContact(name);
    await this.form.fill(data);
    await this.loadList(() => this.button.save.click());
  }

  @step()
  async deleteContact(name: string): Promise<void> {
    if (!await this.deleteContactIfExists(name)) throw new Error(`Contact "${name}" was not found for deletion.`);
  }

  async deleteContactIfExists(name: string): Promise<boolean> {
    if (!/^pw[a-z]+$/.test(name)) throw new Error(`Refusing to delete a contact without the test-owned name prefix: ${name}`);
    const row = await this.findContact(name);
    if (!row) return false;
    await this.clickContactAction(row, 'Delete');
    const dialog = this.dialog.deleteContact;
    await expect(dialog).toContainText('Are you sure you want to delete this contact?');
    await this.loadList(() => dialog.getByRole('button', { name: 'OK', exact: true }).click());
    await expect(dialog).toBeHidden();
    await expect(this.row.contact(name)).toHaveCount(0);
    return true;
  }
}
