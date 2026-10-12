import type { RecompMeasure } from './RecompMeasure';
import type { RecompPart } from './RecompPart';

interface RecompSignalInit {
  weight: RecompPart;
  waist: RecompPart;
  strength: RecompPart;
  trendWeightKg?: number | undefined;
  waistChangeCm?: number | undefined;
  liftsUp?: readonly string[];
}

/**
 * Whether the last four weeks look like a recomp from outside (MM-32):
 * trend weight flat, waist down, strength up. It reports a pattern in
 * what was logged. It does not measure fat or muscle.
 */
export class RecompSignal {
  readonly weight: RecompPart;
  readonly waist: RecompPart;
  readonly strength: RecompPart;

  /** Trend weight now, when it is known. */
  readonly trendWeightKg: number | undefined;

  /**
   * The change in waist over the four weeks, when both ends were measured;
   * below zero is smaller.
   */
  readonly waistChangeCm: number | undefined;

  /** The names of the lifts whose estimated max rose. */
  readonly liftsUp: readonly string[];

  constructor(init: RecompSignalInit) {
    this.weight = init.weight;
    this.waist = init.waist;
    this.strength = init.strength;
    this.trendWeightKg = init.trendWeightKg;
    this.waistChangeCm = init.waistChangeCm;
    this.liftsUp = init.liftsUp ?? [];
  }

  /** All three hold: the signal is there. */
  get present(): boolean {
    return this.weight === 'holds' && this.waist === 'holds' && this.strength === 'holds';
  }

  /**
   * The one measure not logged enough to judge, when the other two hold:
   * logging it would show whether the signal is there. Undefined when the
   * signal is present, when more than one is unknown, or when a part was
   * measured and does not hold.
   */
  get onlyMissing(): RecompMeasure | undefined {
    const parts: readonly (readonly [RecompMeasure, RecompPart])[] = [
      ['weight', this.weight],
      ['waist', this.waist],
      ['strength', this.strength],
    ];
    if (parts.some(([, part]) => part === 'doesNotHold')) return undefined;
    const unknown = parts.filter(([, part]) => part === 'unknown').map(([measure]) => measure);
    return unknown.length === 1 ? unknown[0] : undefined;
  }
}
