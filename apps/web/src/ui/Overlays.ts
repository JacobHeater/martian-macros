import type { MmMenuItem } from './MmMenuItem';

/**
 * The questions and short messages a screen can put over itself. Each
 * question answers with what was chosen, or undefined when it was closed
 * unanswered.
 */
export interface Overlays {
  /**
   * Asks the user to confirm a destructive action. True only if they
   * confirm; the safe choice is the quieter-looking cancel.
   */
  confirm(question: { title: string; message: string; confirmLabel: string; cancelLabel?: string }): Promise<boolean>;

  /** Asks a question with two real answers, neither of them destructive. */
  choice<T>(question: {
    title: string;
    message: string;
    primaryLabel: string;
    primary: T;
    secondaryLabel: string;
    secondary: T;
  }): Promise<T | undefined>;

  /**
   * Asks for one of a short list of options, with the selected one marked
   * in words and with a check, not by color alone.
   */
  options<T>(question: { title: string; options: readonly MmMenuItem<T>[]; selected: T }): Promise<MmMenuItem<T> | undefined>;

  /** Asks for a time of day. Gives minutes after midnight. */
  timeOfDay(question: { initialMinuteOfDay: number; helpText?: string }): Promise<number | undefined>;

  /** Asks for a time of day to the second. Gives milliseconds after midnight. */
  clockTime(question: { title: string; initialMs: number }): Promise<number | undefined>;

  /** Shows a short message at the bottom of the screen, optionally with one action (an "Undo", say). */
  snack(message: string, action?: { label: string; onAction: () => void }): void;
}
