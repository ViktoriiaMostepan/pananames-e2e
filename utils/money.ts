import type { Money } from '../types/domain';

/** Parse an explicitly USD UI amount without floating point arithmetic. */
export function parseUsd(text: string): Money {
  const match = text.trim().match(/^(?:TOTAL:\s*)?\$\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)$/);
  if (!match) {
    throw new Error(`Expected one USD amount, received: ${JSON.stringify(text)}`);
  }
  const [whole, fraction = '00'] = match[1].replaceAll(',', '').split('.');
  const amountMinor = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(amountMinor)) throw new Error('USD amount exceeds safe integer range');
  return { amountMinor, currency: 'USD' };
}
