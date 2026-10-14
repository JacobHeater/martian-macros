import type { CalendarDate } from '../domain/CalendarDate';
import type { ReactNode } from 'react';
import type { MmAnchor } from './MmAnchor';
import type { MmMenuItem } from './MmMenuItem';

/**
 * The questions and short messages a screen can put over itself. Each
 * question answers with what was chosen, or undefined when it was closed
 * unanswered. Every one is drawn by the design system; nothing native shows
 * (MM-262).
 */
export interface Overlays {
  /**
   * Asks the user to confirm a destructive action. True only if they
   * confirm; the safe choice is the stronger-looking cancel (MM-280).
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

  /** Asks for a calendar day from `first` to `last`; `today` is marked when given. */
  date(question: {
    helpText: string;
    initial: CalendarDate;
    first: CalendarDate;
    last: CalendarDate;
    today?: CalendarDate | undefined;
  }): Promise<CalendarDate | undefined>;

  /**
   * Asks for a time of day. Gives minutes after midnight. With `first` and
   * `last` (minutes after midnight) a time outside them is refused with the
   * range said; `everyMinute` offers every minute rather than every fifth.
   */
  timeOfDay(question: {
    initialMinuteOfDay: number;
    helpText?: string;
    first?: number | undefined;
    last?: number | undefined;
    everyMinute?: boolean;
  }): Promise<number | undefined>;

  /** Asks for a time of day to the second. Gives milliseconds after midnight. */
  clockTime(question: { title: string; initialMs: number }): Promise<number | undefined>;

  /**
   * Brings a panel up from the bottom of the screen. `content` draws it and
   * is given the way to close it, with an answer or without one.
   */
  sheet<T>(label: string, content: (close: (answer?: T) => void) => ReactNode): Promise<T | undefined>;

  /**
   * Opens a short menu of actions at `anchor` (the trigger's edges), drawn
   * where nothing can clip it (MM-268). A choice between values is
   * `options`, not a menu.
   */
  menu<T>(question: { label: string; items: readonly MmMenuItem<T>[]; anchor: MmAnchor }): Promise<MmMenuItem<T> | undefined>;

  /**
   * Closes the question on top as simply dismissed, as the phone's back
   * button does; with no question up, dismisses a snack that is waiting on
   * its action. False when nothing was showing.
   */
  closeTop(): boolean;

  /**
   * Shows a short message at the bottom of the screen, optionally with one
   * action (an "Undo", say). A snack with an action waits for it, the next
   * snack or a dismissal; one without goes after a few seconds (MM-272).
   */
  snack(message: string, action?: { label: string; onAction: () => void }): void;
}
