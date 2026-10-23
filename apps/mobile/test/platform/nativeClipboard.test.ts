import { expect, it } from 'vitest';
import type { MmClipboardApi } from '../../src/platform/MmClipboardApi';
import { NativeClipboard } from '../../src/platform/NativeClipboard';

/** MM-590: Paste reads the phone's clipboard through the shell, since Android's WebView cannot. */
class FakeClipboardApi implements MmClipboardApi {
  text: string | undefined;
  refuses = false;

  async readClipboard(): Promise<{ text?: string }> {
    if (this.refuses) throw new Error('Not allowed.');
    return this.text === undefined ? {} : { text: this.text };
  }

  async writeClipboard({ text }: { text: string }): Promise<void> {
    if (this.refuses) throw new Error('Not allowed.');
    this.text = text;
  }
}

it('MM-590: writes and reads the phone’s clipboard', async () => {
  const api = new FakeClipboardApi();
  const clipboard = new NativeClipboard(api);
  expect(await clipboard.write('the answer')).toBe(true);
  expect(api.text).toBe('the answer');
  expect(await clipboard.read()).toBe('the answer');
});

it('an empty clipboard reads as nothing', async () => {
  const api = new FakeClipboardApi();
  expect(await new NativeClipboard(api).read()).toBeUndefined();
  api.text = '';
  expect(await new NativeClipboard(api).read()).toBeUndefined();
});

it('a refusal answers false or nothing, never an error', async () => {
  const api = new FakeClipboardApi();
  api.refuses = true;
  const clipboard = new NativeClipboard(api);
  expect(await clipboard.write('the answer')).toBe(false);
  expect(await clipboard.read()).toBeUndefined();
});
