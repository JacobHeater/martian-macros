import { afterEach, expect, it, vi } from 'vitest';
import { NavigatorClipboard } from '../../src/platform/NavigatorClipboard';

/** MM-586: the WebView's clipboard, where a refusal is an answer and never an error. */
const withClipboard = (clipboard: Partial<Clipboard>) => vi.stubGlobal('navigator', { ...navigator, clipboard });

/** The page's copy command: what it was asked to copy, and whether it does; none at all when `copies` is undefined. */
function withCopyCommand(copies: boolean | undefined): string[] {
  const copied: string[] = [];
  const execCommand =
    copies === undefined
      ? undefined
      : (command: string) => {
          const field = document.querySelector('textarea');
          if (command === 'copy' && field !== null) copied.push(field.value.slice(field.selectionStart, field.selectionEnd));
          return copies;
        };
  Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true, writable: true });
  return copied;
}

afterEach(() => {
  vi.unstubAllGlobals();
  withCopyCommand(undefined);
});

const refused = () => Promise.reject(new Error('NotAllowedError'));

// MM-589: Android's WebView refuses the clipboard API's write, so "Copy prompt" said the phone did not allow copying.
it('MM-589: copies by selection when the clipboard API refuses, as Android’s WebView does, and leaves nothing behind', async () => {
  withClipboard({ writeText: refused });
  const copied = withCopyCommand(true);
  expect(await new NavigatorClipboard().write('the prompt')).toBe(true);
  expect(copied).toEqual(['the prompt']);
  expect(document.querySelector('textarea')).toBeNull();
});

it('falls back to the clipboard API when the page will not copy', async () => {
  let held = '';
  withClipboard({
    writeText: async (text: string) => {
      held = text;
    },
  });
  withCopyCommand(false);
  expect(await new NavigatorClipboard().write('the prompt')).toBe(true);
  expect(held).toBe('the prompt');
});

it('writes and reads the text', async () => {
  let held = '';
  withClipboard({
    writeText: async (text: string) => {
      held = text;
    },
    readText: async () => held,
  });
  const clipboard = new NavigatorClipboard();
  expect(await clipboard.write('the prompt')).toBe(true);
  expect(await clipboard.read()).toBe('the prompt');
});

it('an empty clipboard reads as nothing', async () => {
  withClipboard({ readText: async () => '' });
  expect(await new NavigatorClipboard().read()).toBeUndefined();
});

it('a phone that refuses answers false or nothing', async () => {
  withClipboard({ writeText: refused, readText: refused });
  withCopyCommand(false);
  const clipboard = new NavigatorClipboard();
  expect(await clipboard.write('the prompt')).toBe(false);
  expect(await clipboard.read()).toBeUndefined();
});
