/**
 * The phone's clipboard (MM-586): text the person copies out to another app
 * and pastes back. Each answers false or undefined when the phone refuses,
 * so the screen can say what to do instead.
 */
export interface Clipboard {
  /** Puts `text` on the clipboard; true when it is there. */
  write(text: string): Promise<boolean>;

  /** The text on the clipboard, or undefined when there is none or reading it was refused. */
  read(): Promise<string | undefined>;
}
