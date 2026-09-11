import { randomUUID } from 'node:crypto';

export function createDomainKeyword(): string {
  return `pwtest${randomUUID().replaceAll('-', '').slice(0, 18)}`;
}
