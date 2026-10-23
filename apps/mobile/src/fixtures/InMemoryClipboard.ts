import type { Clipboard } from '../domain/integration/Clipboard';

/** A `Clipboard` held in memory, for tests and stories: never the phone's (MM-586). */
export class InMemoryClipboard implements Clipboard {
  /** What is on it; undefined when nothing is. */
  text: string | undefined;

  /** A phone that refuses to read the clipboard, as some Android WebViews do. */
  refusesRead = false;

  /** A phone that refuses to write to it. */
  refusesWrite = false;

  constructor(text?: string) {
    this.text = text;
  }

  async write(text: string): Promise<boolean> {
    if (this.refusesWrite) return false;
    this.text = text;
    return true;
  }

  async read(): Promise<string | undefined> {
    return this.refusesRead ? undefined : this.text;
  }
}
