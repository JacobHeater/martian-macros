/** The methods of a native plugin that read and write the phone's clipboard (MM-590). */
export interface MmClipboardApi {
  /** The text on the clipboard; none when there is none. */
  readClipboard(): Promise<{ text?: string }>;
  /** Puts `text` on the clipboard. */
  writeClipboard(options: { text: string }): Promise<void>;
}
