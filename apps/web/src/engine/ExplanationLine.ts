import { ArgumentError } from '../lang/ArgumentError';
import { ExplanationReason } from './ExplanationReason';

/** One signed contribution to a change in the calorie target. */
export class ExplanationLine {
  readonly reason: ExplanationReason;

  /** How much this cause moved the calorie target, signed. */
  readonly kcal: number;

  /**
   * What the cause moved from and to, when that helps to say it: the
   * expenditure before and after, or the target the floor held up.
   */
  readonly from: number | undefined;
  readonly to: number | undefined;

  constructor(
    reason: ExplanationReason,
    kcal: number,
    { from, to }: { from?: number | undefined; to?: number | undefined } = {},
  ) {
    this.reason = reason;
    this.kcal = kcal;
    this.from = from;
    this.to = to;
  }

  static fromJson(json: Record<string, unknown>): ExplanationLine {
    const reason = json['reason'];
    const kcal = json['kcal'];
    const from = json['from'];
    const to = json['to'];
    if (typeof reason !== 'string' || !(ExplanationReason.values as readonly string[]).includes(reason)) {
      throw new ArgumentError(`Not an explanation reason: ${String(reason)}`);
    }
    if (typeof kcal !== 'number') throw new ArgumentError(`Not a number of kcal: ${String(kcal)}`);
    return new ExplanationLine(reason as ExplanationReason, kcal, {
      from: typeof from === 'number' ? from : undefined,
      to: typeof to === 'number' ? to : undefined,
    });
  }

  toJson(): Record<string, unknown> {
    const json: Record<string, unknown> = { reason: this.reason, kcal: this.kcal };
    if (this.from !== undefined) json['from'] = this.from;
    if (this.to !== undefined) json['to'] = this.to;
    return json;
  }
}
