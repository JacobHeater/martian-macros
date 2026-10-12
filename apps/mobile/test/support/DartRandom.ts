const mask64 = (1n << 64n) - 1n;
const mask32 = 0xffffffffn;
const a = 0xffffda61n;

/**
 * The Dart VM's seeded `Random`, so tests carried over from Dart draw the
 * same numbers and keep their expected values. A multiply-with-carry
 * generator seeded through a 64-bit mix, as in the SDK's `math_patch.dart`.
 * For tests only: nothing the app ships needs repeatable random numbers.
 */
export class DartRandom {
  private state: bigint;

  constructor(seed: number) {
    this.state = setupSeed(BigInt(seed));
    for (let i = 0; i < 4; i++) this.nextState();
  }

  private nextState(): void {
    const low = this.state & mask32;
    const high = this.state >> 32n;
    this.state = (a * low + high) & mask64;
  }

  /** A whole number from 0 up to but not including `max`, which is at most 2^32. */
  nextInt(max: number): number {
    if (!Number.isInteger(max) || max <= 0 || max > 2 ** 32) {
      throw new RangeError(`max must be positive and <= 2^32: ${max}`);
    }
    const big = BigInt(max);
    if ((big & -big) === big) {
      // Fast case for powers of two.
      this.nextState();
      return Number(this.state & mask32 & (big - 1n));
    }
    let random32: bigint;
    let result: bigint;
    do {
      this.nextState();
      random32 = this.state & mask32;
      result = random32 % big;
    } while (random32 - result + big > 1n << 32n);
    return Number(result);
  }

  /** A number from 0 up to but not including 1. */
  nextDouble(): number {
    return (this.nextInt(2 ** 26) * 2 ** 27 + this.nextInt(2 ** 27)) / 2 ** 53;
  }

  nextBool(): boolean {
    return this.nextInt(2) === 0;
  }
}

/** Thomas Wang's 64-bit mix, on 64-bit wrapping arithmetic. */
function setupSeed(seed: bigint): bigint {
  let n = seed & mask64;
  n = ((~n & mask64) + (n << 21n)) & mask64;
  n = n ^ (n >> 24n);
  n = (n * 265n) & mask64;
  n = n ^ (n >> 14n);
  n = (n * 21n) & mask64;
  n = n ^ (n >> 28n);
  n = (n + (n << 31n)) & mask64;
  return n === 0n ? 0x5a17n : n;
}
