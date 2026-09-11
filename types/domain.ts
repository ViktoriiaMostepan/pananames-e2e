export interface Money {
  amountMinor: number;
  currency: 'USD';
}

export interface DomainOffer {
  name: string;
  price: Money;
  periodYears: 1;
}
