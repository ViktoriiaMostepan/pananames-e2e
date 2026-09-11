import { test } from '@playwright/test';

type AsyncMethod<This, Args extends unknown[], Result> = (
  this: This,
  ...args: Args
) => Promise<Result>;

export function step(name?: string) {
  return function <This, Args extends unknown[], Result>(
    method: AsyncMethod<This, Args, Result>,
    context: ClassMethodDecoratorContext<This, AsyncMethod<This, Args, Result>>,
  ): AsyncMethod<This, Args, Result> {
    return async function (this: This, ...args: Args): Promise<Result> {
      const className = (this as { constructor: { name: string } }).constructor.name;
      return test.step(name ?? `${className}.${String(context.name)}`, () => method.call(this, ...args), { box: true });
    };
  };
}
