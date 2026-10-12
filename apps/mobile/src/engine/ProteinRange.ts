export class ProteinRange {
  readonly minG: number;
  readonly maxG: number;

  constructor(minG: number, maxG: number) {
    this.minG = minG;
    this.maxG = maxG;
  }

  get midG(): number {
    return (this.minG + this.maxG) / 2;
  }
}
