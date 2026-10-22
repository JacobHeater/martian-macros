import { describe, expect, it } from 'vitest';
import type { PrivateScreen } from '../../src/domain/integration/PrivateScreen';

/**
 * What every `PrivateScreen` must do (MM-157): hiding gives the way to
 * stop, which may be called more than once; the screen stays hidden while
 * any caller hides it and is shown again only when the last stops. Where
 * the hiding can be seen (`hidden`), that is checked; where there is
 * nothing to hide from (`hidden` undefined), only that it is safe to call.
 */
export function privateScreenContract(
  name: string,
  create: () => { screen: PrivateScreen; hidden: (() => Promise<boolean>) | undefined },
): void {
  describe(`${name} as PrivateScreen`, () => {
    it('hidden while any caller hides it, shown when the last stops', async () => {
      const { screen, hidden } = create();
      const photos = screen.hide();
      const camera = screen.hide();
      if (hidden !== undefined) expect(await hidden()).toBe(true);
      photos();
      if (hidden !== undefined) expect(await hidden(), 'one caller still hides it').toBe(true);
      camera();
      if (hidden !== undefined) expect(await hidden()).toBe(false);
    });

    it('stopping twice does not show what another caller hides', async () => {
      const { screen, hidden } = create();
      const first = screen.hide();
      const second = screen.hide();
      first();
      first();
      if (hidden !== undefined) expect(await hidden()).toBe(true);
      second();
      if (hidden !== undefined) expect(await hidden()).toBe(false);
    });

    it('can hide again after being shown', async () => {
      const { screen, hidden } = create();
      screen.hide()();
      const again = screen.hide();
      if (hidden !== undefined) expect(await hidden()).toBe(true);
      again();
      if (hidden !== undefined) expect(await hidden()).toBe(false);
    });
  });
}
