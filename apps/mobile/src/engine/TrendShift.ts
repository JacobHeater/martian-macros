interface TrendShiftInit {
  levelMeanKg?: number;
  levelSigmaKg: number;
  slopeSigmaKgPerDay: number;
}

/**
 * Extra movement the trend is allowed on one day, beyond ordinary tissue
 * change: used on days when intake has just changed level.
 */
export class TrendShift {
  readonly levelMeanKg: number;
  readonly levelSigmaKg: number;
  readonly slopeSigmaKgPerDay: number;

  constructor(init: TrendShiftInit) {
    this.levelMeanKg = init.levelMeanKg ?? 0;
    this.levelSigmaKg = init.levelSigmaKg;
    this.slopeSigmaKgPerDay = init.slopeSigmaKgPerDay;
  }
}
