/**
 * The zone around a calorie target that counts as "on target" (MM-123):
 * within the larger of 5% and 100 kcal, either side. Food cannot be measured
 * more finely than that, so close is as good as exact.
 */
export class CalorieBand {
  static readonly fraction = 0.05;
  static readonly minimumKcal = 100;

  readonly targetKcal: number;

  constructor(targetKcal: number) {
    this.targetKcal = targetKcal;
  }

  get halfWidthKcal(): number {
    return Math.max(this.targetKcal * CalorieBand.fraction, CalorieBand.minimumKcal);
  }

  get lowKcal(): number {
    return this.targetKcal - this.halfWidthKcal;
  }

  get highKcal(): number {
    return this.targetKcal + this.halfWidthKcal;
  }

  contains(kcal: number): boolean {
    return kcal >= this.lowKcal && kcal <= this.highKcal;
  }
}
