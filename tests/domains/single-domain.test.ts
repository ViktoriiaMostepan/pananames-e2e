import { test, expect } from '../../fixtures/test.fixture';
import { findAvailableDomain } from '../../helpers/domain-search.helper';
import { domainZones } from '../../test-data/domain-zones';

test.describe('One domain in the cart', () => {
  for (const zone of domainZones) {
    test(`TOTAL matches the search price for .${zone}`, async ({ registerDomainPage, cartPage, ownedDomains }) => {
      await registerDomainPage.goto();
      const offer = await findAvailableDomain(registerDomainPage, zone);

      ownedDomains.add(offer.name);
      await registerDomainPage.addToCart(offer.name);
      await cartPage.goto();

      await expect.poll(() => cartPage.getDomainNames()).toEqual([offer.name]);
      expect(await cartPage.getPeriodYears(offer.name)).toBe(offer.periodYears);
      await expect.poll(() => cartPage.getTotal()).toEqual(offer.price);
    });
  }
});
