import { expect, it } from 'vitest';
import { Platform } from '../../src/domain/integration/Platform';
import { runningOn } from '../../src/platform/runningOn';

/** MM-403: the test runner is a browser as far as the shell is concerned, and a browser is `web`. */
it('a browser is the web, which is never a product', () => {
  expect(runningOn()).toBe('web');
  expect(Platform.values).toEqual(['android', 'ios', 'web']);
});
