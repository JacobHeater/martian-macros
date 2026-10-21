import { describe, expect, it } from 'vitest';
import type { ExternalLinks } from '../../src/domain/integration/ExternalLinks';

/** An `ExternalLinks` with a view of what reached the phone's browser (or what stands in for it). */
export interface ExternalLinksHarness {
  links: ExternalLinks;
  /** The addresses the browser was handed, in order. */
  opened(): readonly string[];
}

/** What every `ExternalLinks` must do (MM-454). */
export function externalLinksContract(name: string, create: () => ExternalLinksHarness): void {
  describe(`${name} as ExternalLinks`, () => {
    it('hands an https address to the browser, as it was given', async () => {
      const harness = create();
      await harness.links.openInBrowser('https://jacobheater.github.io/martian-macros/');
      expect(harness.opened()).toEqual(['https://jacobheater.github.io/martian-macros/']);
    });

    it.each([
      ['an http address', 'http://jacobheater.github.io/martian-macros/'],
      ['another scheme', 'javascript:alert(1)'],
      ['a file', 'file:///data/data/com.martianmacros/databases/mm.db'],
      ['a relative path', '/martian-macros/'],
      ['nothing', ''],
    ])('refuses %s, and opens nothing', async (_what, address) => {
      const harness = create();
      await expect(harness.links.openInBrowser(address)).rejects.toThrow();
      expect(harness.opened()).toEqual([]);
    });
  });
}
