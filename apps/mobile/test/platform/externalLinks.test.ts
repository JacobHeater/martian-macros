import { expect, it } from 'vitest';
import { InMemoryExternalLinks } from '../../src/fixtures/InMemoryExternalLinks';
import { NativeExternalLinks } from '../../src/platform/NativeExternalLinks';
import { WindowExternalLinks } from '../../src/platform/WindowExternalLinks';
import { externalLinksContract } from '../contracts/externalLinksContract';

/** MM-454: every way of opening a page in the browser, held to one contract. */
externalLinksContract('In-memory', () => {
  const links = new InMemoryExternalLinks();
  return { links, opened: () => links.opened };
});

// The adapter the phone uses, with the plugin stood in for.
externalLinksContract('Native (bridge stood in for)', () => {
  const opened: string[] = [];
  const links = new NativeExternalLinks({
    openInBrowser: async ({ url }) => {
      opened.push(url);
    },
  });
  return { links, opened: () => opened };
});

// The dev server's, with window.open stood in for.
externalLinksContract('Window (window.open stood in for)', () => {
  const opened: string[] = [];
  const links = new WindowExternalLinks((url) => opened.push(url));
  return { links, opened: () => opened };
});

it('a phone with no browser refuses, through the shell and in the fixture alike', async () => {
  const native = new NativeExternalLinks({
    openInBrowser: async () => {
      throw new Error('No browser is installed.');
    },
  });
  await expect(native.openInBrowser('https://jacobheater.github.io/martian-macros/')).rejects.toThrow('No browser is installed.');
  const fixture = new InMemoryExternalLinks();
  fixture.noBrowser = true;
  await expect(fixture.openInBrowser('https://jacobheater.github.io/martian-macros/')).rejects.toThrow('No browser is installed.');
  expect(fixture.opened).toEqual([]);
});

it('a new tab in a browser is given no hold on the app', async () => {
  const calls: string[][] = [];
  await new WindowExternalLinks((...args) => calls.push(args)).openInBrowser('https://jacobheater.github.io/martian-macros/');
  expect(calls).toEqual([['https://jacobheater.github.io/martian-macros/', '_blank', 'noopener,noreferrer']]);
});
