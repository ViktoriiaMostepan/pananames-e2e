import { test, expect } from '../../fixtures/test.fixture';
import { findAvailableDomainsByKeyword } from '../../helpers/domain-search.helper';

test.describe('Multiple domains in the cart', () => {
  test('TOTAL matches three available domains found by SLD', async ({ registerDomainPage, cartPage, ownedDomains }) => {
    await registerDomainPage.goto();
    const offers = await findAvailableDomainsByKeyword(registerDomainPage, 3);

    expect(offers).toHaveLength(3);
    expect(new Set(offers.map(offer => offer.name)).size).toBe(3);
    for (const offer of offers) {
      expect(offer.price.currency).toBe('USD');
      ownedDomains.add(offer.name);
      await registerDomainPage.addToCart(offer.name);
    }

    await cartPage.goto();
    const expectedNames = offers.map(offer => offer.name).sort();
    await expect.poll(async () => (await cartPage.getDomainNames()).sort()).toEqual(expectedNames);
    for (const offer of offers) {
      expect(await cartPage.getPeriodYears(offer.name)).toBe(offer.periodYears);
    }
    await expect.poll(() => cartPage.getTotal()).toEqual({
      amountMinor: offers.reduce((sum, offer) => sum + offer.price.amountMinor, 0),
      currency: 'USD',
    });
  });
});
