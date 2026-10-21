import { type CalendarDate, type UnitSystem, Units, type WeightDisplay } from '../domain';
import { groupThousands } from '../lang/groupThousands';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const monthOf = (date: CalendarDate) => months[date.month - 1] as string;
const shortMonthOf = (date: CalendarDate) => monthOf(date).substring(0, 3);
const weekdayOf = (date: CalendarDate) => weekdays[new Date(date.year, date.month - 1, date.day).getDay()] as string;

const sign = (value: number) => (value > 0 ? '+' : value < 0 ? '−' : '');

/** `text`, the rounded size of `value`, signed only when it is not zero once rounded (MM-341). */
const signed = (value: number, text: string) => `${Number(text) === 0 ? '' : sign(value)}${text}`;

/** What a body-weight figure reads as where the person chose to see none (MM-118). */
const hiddenWeight = 'hidden';

/**
 * Unit-aware formatting. Storage is always SI; this is the only place
 * imperial units exist.
 *
 * `weight` and `weightDelta` are the person's body weight: with the weight
 * display Hidden (MM-118) they give no figure, so a screen that forgets the
 * setting still shows none. `reading` is one weigh-in, shown only with
 * Everything. A lifted load is `load` and `loadDelta`, never hidden.
 */
export class Fmt {
  readonly units: UnitSystem;
  readonly weightDisplay: WeightDisplay;

  constructor(units: UnitSystem, { weightDisplay = 'everything' }: { weightDisplay?: WeightDisplay } = {}) {
    this.units = units;
    this.weightDisplay = weightDisplay;
  }

  /** Whether no body-weight figure is shown (MM-118). */
  get weightHidden(): boolean {
    return this.weightDisplay === 'hidden';
  }

  /** Whether a single weigh-in is shown (MM-118): only with Everything. */
  get readingsShown(): boolean {
    return this.weightDisplay === 'everything';
  }

  get imperial(): boolean {
    return this.units === 'imperial';
  }

  get weightUnit(): string {
    return this.imperial ? 'lb' : 'kg';
  }

  get lengthUnit(): string {
    return this.imperial ? 'in' : 'cm';
  }

  weightFromKg(kg: number): number {
    return this.imperial ? Units.kgToLb(kg) : kg;
  }

  weightToKg(value: number): number {
    return this.imperial ? Units.lbToKg(value) : value;
  }

  lengthFromCm(cm: number): number {
    return this.imperial ? Units.cmToInches(cm) : cm;
  }

  lengthToCm(value: number): number {
    return this.imperial ? Units.inchesToCm(value) : value;
  }

  /** A body weight; none with the weight display Hidden (MM-118). */
  weight(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    return this.weightHidden ? hiddenWeight : this.load(kg, { decimals });
  }

  /** A signed body-weight change, e.g. "−0.8 lb"; none with the weight display Hidden (MM-118). */
  weightDelta(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    return this.weightHidden ? hiddenWeight : this.loadDelta(kg, { decimals });
  }

  /** One weigh-in as read: shown only with the weight display Everything (MM-118). */
  reading(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    return this.readingsShown ? this.load(kg, { decimals }) : hiddenWeight;
  }

  /** A weight lifted, or any weight that is not the person's body: always shown. */
  load(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    return `${toStringAsFixed(this.weightFromKg(kg), decimals)} ${this.weightUnit}`;
  }

  /** A signed change in a weight lifted. */
  loadDelta(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    const v = this.weightFromKg(kg);
    return `${signed(v, toStringAsFixed(Math.abs(v), decimals))} ${this.weightUnit}`;
  }

  length(cm: number): string {
    return `${toStringAsFixed(this.lengthFromCm(cm), 1)} ${this.lengthUnit}`;
  }

  static kcal(value: number): string {
    return `${Fmt.whole(value)} kcal`;
  }

  static whole(value: number): string {
    return groupThousands(roundHalfAwayFromZero(value));
  }

  static grams(value: number): string {
    return `${roundHalfAwayFromZero(value)} g`;
  }

  static percentPerWeek(fraction: number): string {
    const pct = fraction * 100;
    return `${signed(pct, toStringAsFixed(Math.abs(pct), 2))}% / week`;
  }

  static day(date: CalendarDate, today: CalendarDate): string {
    const diff = today.daysUntil(date);
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    return `${weekdayOf(date)}, ${shortMonthOf(date)} ${date.day}`;
  }

  static shortDay(date: CalendarDate): string {
    return `${shortMonthOf(date)} ${date.day}`;
  }

  static longDate(date: CalendarDate): string {
    return `${monthOf(date)} ${date.day}, ${date.year}`;
  }

  static monthYear(date: CalendarDate): string {
    return `${monthOf(date)} ${date.year}`;
  }
}
