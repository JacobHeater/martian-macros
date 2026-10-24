import type { CalendarDate } from '../domain/CalendarDate';
import type { ReactNode } from 'react';
import type { MmAnchor } from './MmAnchor';
import type { MmMenuItem } from './MmMenuItem';
import type { MmPopoverRow } from './MmPopoverRow';

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
  options<T>(question: { title: string; options: readonly MmMenuItem<T>[]; selected?: T | undefined }): Promise<MmMenuItem<T> | undefined>;

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
   * With `refuse`, a time it gives a reason for is refused with that reason
   * while the dialog stays open on it (MM-222, MM-441).
   */
  timeOfDay(question: {
    initialMinuteOfDay: number;
    helpText?: string;
    first?: number | undefined;
    last?: number | undefined;
    everyMinute?: boolean;
    refuse?: ((minuteOfDay: number) => string | undefined) | undefined;
  }): Promise<number | undefined>;

  /**
   * Asks for a time of day to the second. Gives milliseconds after
   * midnight. With `refuse`, a time it gives a reason for is refused with
   * that reason while the dialog stays open on it (MM-222).
   */
  clockTime(question: {
    title: string;
    initialMs: number;
    refuse?: ((timeMs: number) => string | undefined) | undefined;
  }): Promise<number | undefined>;

  /**
   * Brings a panel up from the bottom of the screen. `content` draws it and
   * is given the way to close it, with an answer or without one. A "tall"
   * sheet keeps one height whatever it holds (MM-566).
   */
  sheet<T>(
    label: string,
    content: (close: (answer?: T) => void) => ReactNode,
    options?: { size?: 'fit' | 'tall' },
  ): Promise<T | undefined>;

  /**
   * Opens a short menu of actions at `anchor` (the trigger's edges), drawn
   * where nothing can clip it (MM-268). A choice between values is
   * `options`, not a menu.
   */
  menu<T>(question: { label: string; items: readonly MmMenuItem<T>[]; anchor: MmAnchor }): Promise<MmMenuItem<T> | undefined>;

  /**
   * Explains something in a few words beside what was pressed, at `anchor`
   * (MM-370), drawn where nothing can clip it. Resolves once it is closed.
   * `label` is what a screen reader hears for it, when the title reads
   * badly aloud ("Grade B-" said as "Grade B minus"). `rows`, when given,
   * are listed under the message (MM-562: a macro's top foods).
   */
  popover(explanation: {
    title: string;
    message?: string | undefined;
    rows?: readonly MmPopoverRow[] | undefined;
    anchor: MmAnchor;
    label?: string | undefined;
  }): Promise<void>;

  /**
   * Closes the question on top as simply dismissed, as the phone's back
   * button does; with no question up, dismisses a snack that is waiting on
   * its action. False when nothing was showing.
   */
  closeTop(): boolean;

  /**
   * Shows a short message at the bottom of the screen, optionally with one
   * action (an "Undo", say). Every snack goes after ten seconds, or sooner by
   * its action, the next snack or a dismissal; it stays while it is focused
   * or pointed at (MM-601, which replaced MM-272's waiting Undo).
   */
  snack(message: string, action?: { label: string; onAction: () => void }): void;
}
