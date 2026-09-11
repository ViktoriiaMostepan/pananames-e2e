export interface ContactData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  country: 'Poland (Polska)' | 'Germany (Deutschland)';
  callingCode: '+48' | '+49';
  phoneNumber: string;
  comment: string;
  promotionalEmails: boolean;
  productEmails: boolean;
  financialEmails: boolean;
}
