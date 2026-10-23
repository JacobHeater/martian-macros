import type { Clipboard } from '../domain/integration/Clipboard';
import type { MmClipboardApi } from './MmClipboardApi';

/**
 * `Clipboard` through the shell (MM-590): `MmBackup.readClipboard` and
 * `writeClipboard`, the phone's own clipboard (`ClipboardManager` on
 * Android, `UIPasteboard` on iOS). The WebView's clipboard cannot be read
 * on Android at all, so Paste is native. A refusal is an answer, never an
 * error.
 */
export class NativeClipboard implements Clipboard {
  private readonly api: MmClipboardApi;

  constructor(api: MmClipboardApi) {
    this.api = api;
  }

  async write(text: string): Promise<boolean> {
    try {
      await this.api.writeClipboard({ text });
      return true;
    } catch {
      return false;
    }
  }

  async read(): Promise<string | undefined> {
    try {
      const { text } = await this.api.readClipboard();
      return text === undefined || text === '' ? undefined : text;
    } catch {
      return undefined;
    }
  }
}
