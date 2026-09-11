import { expect, type Locator, type Page } from '@playwright/test';
import type { DomainOffer } from '../types/domain';
import { parseUsd } from '../utils/money';
import { step } from '../utils/step';
import { BasePage } from './base.page';

export class RegisterDomainPage extends BasePage {
  readonly heading = {
    availability: this.page.getByRole('heading', { name: 'Domain availability check and order' }),
  };

  readonly input = {
    search: this.page.getByPlaceholder('Enter domain name or keyword'),
  };

  readonly row = {
    domain: this.page.locator('.va-list-item.list__item'),
    byName: (name: string): Locator => this.page.locator('.va-list-item.list__item').filter({
      has: this.page.getByText(name, { exact: true }),
    }),
  };

  readonly label = {
    loading: this.page.getByText('rotate_left', { exact: true }),
  };

  readonly button = {
    addToCart: (name: string): Locator => this.row.byName(name)
      .getByRole('button', { name: 'Add to cart', exact: true }),
    adding: (name: string): Locator => this.row.byName(name)
      .getByRole('button', { name: 'Adding...', exact: true }),
  };

  constructor(page: Page) {
    super(page);
  }

  @step()
  async goto(): Promise<void> {
    await this.page.goto('/register-domain');
    await expect(this.heading.availability).toBeVisible();
  }

  @step()
  async search(query: string): Promise<void> {
    await this.input.search.fill(query);
    await this.input.search.press('Enter');
    // Wait for results belonging to this search, not a stale previous result set.
    const keyword = query.split('.')[0];
    await expect(this.row.domain.first().locator('.domain-name')).toContainText(`${keyword}.`);
    await expect(this.label.loading).toBeHidden();
  }

  @step()
  async getAvailableOffers(): Promise<DomainOffer[]> {
    const offers = await this.row.domain.evaluateAll(rows => rows.flatMap(row => {
      const add = Array.from(row.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Add to cart');
      if (!add || add.disabled || add.getAttribute('aria-disabled') === 'true') return [];
      const term = row.querySelector('[role="combobox"]')?.textContent?.replace('expand_more', '').trim();
      if (term !== '1 year') return [];
      const name = row.querySelector('.domain-name')?.textContent?.trim();
      const price = row.querySelector('span.text-right.text-gray-900')?.cloneNode(true) as HTMLElement | undefined;
      if (!name || !price) throw new Error('Available one-year offer has no domain name or price');
      price.querySelectorAll('del').forEach(oldPrice => oldPrice.remove());
      return [{ name, price: price.textContent ?? '' }];
    }));
    return offers.map(offer => ({ name: offer.name, price: parseUsd(offer.price), periodYears: 1 }));
  }

  @step()
  async addToCart(name: string): Promise<void> {
    await this.button.addToCart(name).click();
    await expect(this.button.addToCart(name)).toBeHidden();
    await expect(this.button.adding(name)).toBeHidden();
  }
}
