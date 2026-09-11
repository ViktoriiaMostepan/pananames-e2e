import { expect, type Locator, type Page } from '@playwright/test';
import type { Money } from '../types/domain';
import { parseUsd } from '../utils/money';
import { step } from '../utils/step';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  readonly heading = {
    state: this.page.getByRole('heading', { name: /^(Shopping cart|Cart is empty)$/ }),
    empty: this.page.getByRole('heading', { name: 'Cart is empty', exact: true }),
  };

  readonly row = {
    domain: this.page.getByRole('row').filter({ has: this.page.getByRole('cell', { name: /^Register\s+/ }) }),
    byName: (name: string): Locator => this.page.getByRole('row').filter({
      has: this.page.getByRole('cell', { name: `Register ${name}`, exact: true }),
    }),
    otherItem: this.page.locator('tbody tr').filter({
      hasNot: this.page.getByRole('cell', { name: /^Register\s+/ }),
    }),
  };

  readonly label = {
    total: this.page.getByText(/^TOTAL:\s*\$/),
  };

  readonly button = {
    removeDomain: (name: string): Locator => this.row.byName(name)
      .getByRole('cell').last().getByRole('button'),
  };

  constructor(page: Page) {
    super(page);
  }

  @step()
  async goto(): Promise<void> {
    await this.loadCart();
    await expect(this.heading.state).toBeVisible();
    await expect(async () => {
      const empty = await this.heading.empty.isVisible();
      if (empty) await expect(this.row.domain).toHaveCount(0);
      else await expect(this.row.domain.first()).toBeVisible();
    }).toPass({ timeout: 15_000 });
  }

  private async loadCart(): Promise<void> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const [response] = await Promise.all([
        this.page.waitForResponse(response => new URL(response.url()).pathname === '/api/cart/get'
          && response.request().method() === 'GET'),
        this.page.goto('/cart'),
      ]);
      await response.finished();
      if (response.ok()) return;
      if (response.status() !== 429 || attempt === 3) {
        throw new Error(`Cart request failed after ${attempt} attempt(s): ${response.status()}`);
      }
      const retryAfterSeconds = Number(response.headers()['retry-after'] ?? '1');
      const delayMs = Number.isFinite(retryAfterSeconds)
        ? Math.min(Math.max(retryAfterSeconds * 1_000, 1_000), 10_000)
        : 1_000;
      await this.page.waitForTimeout(delayMs);
    }
  }

  async getDomainNames(): Promise<string[]> {
    if (await this.row.otherItem.count()) throw new Error('Shared cart contains unsupported items; existing items will not be removed.');
    return (await this.row.domain.getByRole('cell', { name: /^Register\s+/ }).allTextContents())
      .map(text => text.trim().replace(/^Register\s+/, '').trim());
  }

  async getTotal(): Promise<Money> {
    return parseUsd(await this.label.total.innerText());
  }

  async getPeriodYears(name: string): Promise<number> {
    const text = (await this.row.byName(name).getByRole('cell').nth(1).innerText()).replace('expand_more', '');
    const match = text.match(/^\s*(\d+)\s+years?\s*$/);
    if (!match) throw new Error(`Unexpected registration term: ${JSON.stringify(text)}`);
    return Number(match[1]);
  }

  @step()
  async removeDomainIfExists(name: string): Promise<void> {
    const row = this.row.byName(name);
    if (await row.count() === 0) return;
    await this.button.removeDomain(name).click();
    await expect(row).toHaveCount(0);
  }
}
