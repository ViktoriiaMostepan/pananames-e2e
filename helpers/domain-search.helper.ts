import type { RegisterDomainPage } from '../pages/register-domain.page';
import { createDomainKeyword } from '../test-data/domain.factory';
import type { DomainOffer } from '../types/domain';

const maxSearchAttempts = 3;

export async function findAvailableDomain(page: RegisterDomainPage, zone: string): Promise<DomainOffer> {
  for (let attempt = 0; attempt < maxSearchAttempts; attempt++) {
    const name = `${createDomainKeyword()}.${zone}`;
    await page.search(name);
    const offer = (await page.getAvailableOffers()).find(result => result.name === name);
    if (offer) return offer;
  }
  throw new Error(`No available .${zone} domain found after ${maxSearchAttempts} unique searches`);
}

export async function findAvailableDomainsByKeyword(page: RegisterDomainPage, count: number): Promise<DomainOffer[]> {
  for (let attempt = 0; attempt < maxSearchAttempts; attempt++) {
    await page.search(createDomainKeyword());
    const offers = (await page.getAvailableOffers()).slice(0, count);
    if (offers.length === count) return offers;
  }
  throw new Error(`Could not find ${count} available domains after ${maxSearchAttempts} SLD searches`);
}
