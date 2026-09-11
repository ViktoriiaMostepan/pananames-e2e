import { expect, type Locator, type Page } from '@playwright/test';
import type { ContactData } from '../types/contact';

export class ContactFormComponent {
  readonly input: {
    name: Locator;
    firstName: Locator;
    lastName: Locator;
    email: Locator;
    phoneNumber: Locator;
    comment: Locator;
  };

  readonly label: { country: Locator };

  readonly checkbox: {
    promotionalEmails: Locator;
    productEmails: Locator;
    financialEmails: Locator;
  };

  readonly container: { countryPicker: Locator };

  readonly option: { country: (name: string) => Locator };

  constructor(private readonly page: Page) {
    this.input = {
      name: this.field(/^Contact type\/NAME$/),
      firstName: this.field(/^First Name$/),
      lastName: this.field(/^Last Name$/),
      email: this.field(/^Email$/),
      phoneNumber: this.field(/^Phone number$/),
      comment: this.field(/^Comment \(optional\)$/),
    };
    this.label = { country: page.locator('.country-intl-label-text') };
    this.checkbox = {
      promotionalEmails: page.getByRole('checkbox', {
        name: 'Send promotional emails (usually once a month)', exact: true,
      }),
      productEmails: page.getByRole('checkbox', {
        name: 'Send product emails (domain registrations, renewals, failures, etc.)', exact: true,
      }),
      financialEmails: page.getByRole('checkbox', {
        name: 'Send financial emails (balance notifications)', exact: true,
      }),
    };
    this.container = { countryPicker: page.locator('.country-intl-input-wrap') };
    this.option = { country: (name: string): Locator => page.getByText(name, { exact: true }) };
  }

  private field(label: RegExp): Locator {
    // The app repeats a placeholder aria-label on inputs; scope by the visible label.
    return this.page.locator('div.relative')
      .filter({ has: this.page.locator('label').filter({ hasText: label }) })
      .getByRole('textbox');
  }

  async fill(data: ContactData): Promise<void> {
    await this.input.name.fill(data.name);
    await this.input.firstName.fill(data.firstName);
    await this.input.lastName.fill(data.lastName);
    await this.input.email.fill(data.email);
    await this.container.countryPicker.click();
    await this.option.country(data.country).click();
    await expect(this.label.country).toContainText(data.callingCode);
    await this.input.phoneNumber.fill(data.phoneNumber);
    await this.input.comment.fill(data.comment);
    // VaCheckbox draws its square over the native input; use its keyboard interaction.
    for (const [checkbox, checked] of [
      [this.checkbox.promotionalEmails, data.promotionalEmails],
      [this.checkbox.productEmails, data.productEmails],
      [this.checkbox.financialEmails, data.financialEmails],
    ] as const) {
      if (await checkbox.isChecked() !== checked) await checkbox.press('Space');
      await expect(checkbox).toBeChecked({ checked });
    }
  }
}
