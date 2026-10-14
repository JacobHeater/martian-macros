import { type CalendarDate, type UnitSystem, Units } from '../domain';
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

/**
 * Unit-aware formatting. Storage is always SI; this is the only place
 * imperial units exist.
 */
export class Fmt {
  readonly units: UnitSystem;

  constructor(units: UnitSystem) {
    this.units = units;
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

  weight(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    return `${toStringAsFixed(this.weightFromKg(kg), decimals)} ${this.weightUnit}`;
  }

  /** A signed weight change, e.g. "−0.8 lb". */
  weightDelta(kg: number, { decimals = 1 }: { decimals?: number } = {}): string {
    const v = this.weightFromKg(kg);
    return `${sign(v)}${toStringAsFixed(Math.abs(v), decimals)} ${this.weightUnit}`;
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
    return `${sign(pct)}${toStringAsFixed(Math.abs(pct), 2)}% / week`;
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
