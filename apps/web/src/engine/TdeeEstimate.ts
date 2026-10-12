import type { CalendarDate } from '../domain/CalendarDate';
import type { TdeeStatus } from './TdeeStatus';

interface TdeeEstimateInit {
  kcal: number;
  sigmaKcal: number;
  status: TdeeStatus;
  usableIntakeDays?: number;
  excludedPartialDays?: number;
  weighIns?: number;
  windowStart?: CalendarDate | undefined;
  clampedToBounds?: boolean;
  settlingUntil?: CalendarDate | undefined;
  styleRestartOn?: CalendarDate | undefined;
}

export class TdeeEstimate {
  /**
   * Maintenance intake, in the user's own logging units.
   *
   * Consistent logging bias (always under-logging oil, say) is absorbed
   * here, so targets expressed in the same units still produce the
   * intended outcome. Weight change is valued in true kcal, so this is
   * exact once intake is steady at target; the weekly loop converges to
   * that fixed point.
   */
  readonly kcal: number;
  readonly sigmaKcal: number;
  readonly status: TdeeStatus;
  readonly usableIntakeDays: number;
  readonly excludedPartialDays: number;
  readonly weighIns: number;

  /**
   * First day of the window actually used (later than the nominal window
   * start when a logging-style switch truncated it).
   */
  readonly windowStart: CalendarDate | undefined;

  /**
   * True if the raw estimate fell outside the plausible range and was
   * clamped; a strong hint that logging is unreliable.
   */
  readonly clampedToBounds: boolean;

  /**
   * Set when the estimate is held because too few days remain once a
   * settling window is left out: the last day of that window.
   */
  readonly settlingUntil: CalendarDate | undefined;

  /** First day of a new logging-style regime inside the estimator window. */
  readonly styleRestartOn: CalendarDate | undefined;

  constructor(init: TdeeEstimateInit) {
    this.kcal = init.kcal;
    this.sigmaKcal = init.sigmaKcal;
    this.status = init.status;
    this.usableIntakeDays = init.usableIntakeDays ?? 0;
    this.excludedPartialDays = init.excludedPartialDays ?? 0;
    this.weighIns = init.weighIns ?? 0;
    this.windowStart = init.windowStart;
    this.clampedToBounds = init.clampedToBounds ?? false;
    this.settlingUntil = init.settlingUntil;
    this.styleRestartOn = init.styleRestartOn;
  }
}
