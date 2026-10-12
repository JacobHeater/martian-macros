import { ArgumentError } from '../lang/ArgumentError';
import { byName } from '../lang/byName';
import { CoachConfidence } from './CoachConfidence';
import { ExplanationLine } from './ExplanationLine';
import { TdeeStatus } from './TdeeStatus';

interface TargetsExplanationInit {
  lines: readonly ExplanationLine[];
  newKcal: number;
  estimateStatus: TdeeStatus;
  previousKcal?: number | undefined;
  usableIntakeDays?: number;
  excludedPartialDays?: number;
  weighIns?: number;
  confidence?: CoachConfidence | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown) => (typeof value === 'number' ? Math.trunc(value) : 0);

/**
 * Why a set of targets was issued: the contributions to the change in
 * calories, which add up to it, and what the estimate rested on (MM-138).
 */
export class TargetsExplanation {
  /**
   * The contributions, in the order they are told: expenditure, the rest of
   * the calculation, then the limits.
   */
  readonly lines: readonly ExplanationLine[];
  readonly newKcal: number;

  /** Undefined for the first targets. */
  readonly previousKcal: number | undefined;
  readonly estimateStatus: TdeeStatus;

  /** Days of food the estimate used, days left out as partial, and weigh-ins. */
  readonly usableIntakeDays: number;
  readonly excludedPartialDays: number;
  readonly weighIns: number;

  /** The confidence assessment when these targets were issued, if available. */
  readonly confidence: CoachConfidence | undefined;

  constructor(init: TargetsExplanationInit) {
    this.lines = init.lines;
    this.newKcal = init.newKcal;
    this.estimateStatus = init.estimateStatus;
    this.previousKcal = init.previousKcal;
    this.usableIntakeDays = init.usableIntakeDays ?? 0;
    this.excludedPartialDays = init.excludedPartialDays ?? 0;
    this.weighIns = init.weighIns ?? 0;
    this.confidence = init.confidence;
  }

  static decode(source: string): TargetsExplanation {
    const json: unknown = JSON.parse(source);
    if (!isRecord(json)) throw new ArgumentError('An explanation is stored as an object.');
    const lines = json['lines'];
    const newKcal = json['newKcal'];
    const previousKcal = json['previousKcal'];
    const confidence = json['confidence'];
    if (!Array.isArray(lines)) throw new ArgumentError('An explanation has a list of lines.');
    if (typeof newKcal !== 'number') throw new ArgumentError(`newKcal is not a number: ${String(newKcal)}`);
    return new TargetsExplanation({
      lines: lines.map((line: unknown) => {
        if (!isRecord(line)) throw new ArgumentError('An explanation line is stored as an object.');
        return ExplanationLine.fromJson(line);
      }),
      newKcal,
      previousKcal: typeof previousKcal === 'number' ? previousKcal : undefined,
      estimateStatus: byName(TdeeStatus.values, json['estimateStatus']),
      usableIntakeDays: count(json['usableIntakeDays']),
      excludedPartialDays: count(json['excludedPartialDays']),
      weighIns: count(json['weighIns']),
      confidence: isRecord(confidence) ? CoachConfidence.fromJson(confidence) : undefined,
    });
  }

  /** The change in calories, or undefined for the first targets. */
  get change(): number | undefined {
    return this.previousKcal === undefined ? undefined : this.newKcal - this.previousKcal;
  }

  /** What the lines add up to. Equals `change` (the first targets have none). */
  get linesTotal(): number {
    return this.lines.reduce((sum, l) => sum + l.kcal, 0);
  }

  encode(): string {
    const json: Record<string, unknown> = {
      lines: this.lines.map((l) => l.toJson()),
      newKcal: this.newKcal,
    };
    if (this.previousKcal !== undefined) json['previousKcal'] = this.previousKcal;
    json['estimateStatus'] = this.estimateStatus;
    json['usableIntakeDays'] = this.usableIntakeDays;
    json['excludedPartialDays'] = this.excludedPartialDays;
    json['weighIns'] = this.weighIns;
    if (this.confidence !== undefined) json['confidence'] = this.confidence.toJson();
    return JSON.stringify(json);
  }
}
