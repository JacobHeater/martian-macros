import type { MmDayMark } from './MmDayMark';

/** One day of an `MmRhythmStrip`. */
export interface MmRhythmDay {
  /** The day's own key, given back when it is pressed. */
  readonly key: string;
  /** One or two letters under the dot ("M", "Tu"). */
  readonly letter: string;
  /** What a person hears for the day: its name and its state. */
  readonly label: string;
  readonly mark: MmDayMark;
  readonly today?: boolean;
}
