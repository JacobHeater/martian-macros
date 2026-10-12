import { ArgumentError } from '../lang/ArgumentError';
import { StateError } from '../lang/StateError';

/** Minimal dense square matrix for the 3-state filter. */
export class Mat {
  readonly n: number;
  private readonly v: readonly number[];

  private constructor(n: number, v: readonly number[]) {
    this.n = n;
    this.v = v;
  }

  static of(n: number, rowMajor: readonly number[]): Mat {
    if (rowMajor.length !== n * n) throw new ArgumentError(`A ${n} by ${n} matrix needs ${n * n} values.`);
    return new Mat(n, [...rowMajor]);
  }

  static generate(n: number, f: (i: number, j: number) => number): Mat {
    const v: number[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) v.push(f(i, j));
    }
    return new Mat(n, v);
  }

  static diagonal(d: readonly number[]): Mat {
    return Mat.generate(d.length, (i, j) => (i === j ? (d[i] as number) : 0));
  }

  at(i: number, j: number): number {
    return this.v[i * this.n + j] as number;
  }

  mul(o: Mat): Mat {
    return Mat.generate(this.n, (i, j) => {
      let sum = 0;
      for (let k = 0; k < this.n; k++) {
        sum += this.at(i, k) * o.at(k, j);
      }
      return sum;
    });
  }

  apply(x: readonly number[]): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.n; i++) {
      let sum = 0;
      for (let k = 0; k < this.n; k++) {
        sum += this.at(i, k) * (x[k] as number);
      }
      out.push(sum);
    }
    return out;
  }

  add(o: Mat): Mat {
    return Mat.generate(this.n, (i, j) => this.at(i, j) + o.at(i, j));
  }

  sub(o: Mat): Mat {
    return Mat.generate(this.n, (i, j) => this.at(i, j) - o.at(i, j));
  }

  t(): Mat {
    return Mat.generate(this.n, (i, j) => this.at(j, i));
  }

  /** Gauss-Jordan inverse with partial pivoting. */
  inverse(): Mat {
    const n = this.n;
    const a: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) row.push(this.at(i, j));
      for (let j = 0; j < n; j++) row.push(i === j ? 1 : 0);
      a.push(row);
    }
    const row = (r: number) => a[r] as number[];
    const cell = (r: number, c: number) => row(r)[c] as number;
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(cell(r, col)) > Math.abs(cell(pivot, col))) pivot = r;
      }
      const tmp = row(col);
      a[col] = row(pivot);
      a[pivot] = tmp;
      const p = cell(col, col);
      if (p === 0) throw new StateError('Singular covariance');
      for (let j = 0; j < 2 * n; j++) {
        row(col)[j] = cell(col, j) / p;
      }
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const factor = cell(r, col);
        if (factor === 0) continue;
        for (let j = 0; j < 2 * n; j++) {
          row(r)[j] = cell(r, j) - factor * cell(col, j);
        }
      }
    }
    return Mat.generate(n, (i, j) => cell(i, n + j));
  }
}
