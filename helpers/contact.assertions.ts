import { expect } from '@playwright/test';
import type { ContactData } from '../types/contact';
import type { ContactFormComponent } from '../components/contact-form.component';

export async function expectSavedContact(form: ContactFormComponent, data: ContactData): Promise<void> {
  await expect(form.input.name).toHaveValue(data.name);
  await expect(form.input.firstName).toHaveValue(data.firstName);
  await expect(form.input.lastName).toHaveValue(data.lastName);
  await expect(form.input.email).toHaveValue(data.email);
  await expect(form.label.country).toContainText(`${data.callingCode} ${data.country}`);
  await expect(form.input.phoneNumber).toHaveValue(data.phoneNumber);
  await expect(form.input.comment).toHaveValue(data.comment);
  await expect(form.checkbox.promotionalEmails).toBeChecked({ checked: data.promotionalEmails });
  await expect(form.checkbox.productEmails).toBeChecked({ checked: data.productEmails });
  await expect(form.checkbox.financialEmails).toBeChecked({ checked: data.financialEmails });
}
