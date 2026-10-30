import type { QrMatrix } from './QrMatrix';

/** The alphanumeric mode's characters, in their code order. */
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

/**
 * Versions 1 to 10 at error-correction level H: [all codewords, error-correction codewords per block, blocks]. From
 * ISO/IEC 18004:2015, table 9. Level H restores up to about 30% of the codewords, which is what lets a logo cover
 * the middle of the code.
 */
const levelH: readonly (readonly [number, number, number])[] = [
  [26, 17, 1],
  [44, 28, 1],
  [70, 22, 2],
  [100, 16, 4],
  [134, 22, 4],
  [172, 28, 4],
  [196, 26, 5],
  [242, 26, 6],
  [292, 24, 8],
  [346, 28, 8],
];

/** Where the alignment patterns' centres are, by version (Annex E). */
const alignment: readonly (readonly number[])[] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

/** Level H's two format bits (L is 01, M 00, Q 11, H 10). */
const levelHBits = 2;

function dataCodewords(version: number): number {
  const [total, ecc, blocks] = levelH[version - 1] as readonly [number, number, number];
  return total - ecc * blocks;
}

/** The bits of `text` in the alphanumeric mode, padded to the version's data codewords. */
function encodeData(text: string, version: number): number[] {
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0010, 4);
  put(text.length, version < 10 ? 9 : 11);
  for (let i = 0; i + 1 < text.length; i += 2) put(alphabet.indexOf(text[i] as string) * 45 + alphabet.indexOf(text[i + 1] as string), 11);
  if (text.length % 2 === 1) put(alphabet.indexOf(text[text.length - 1] as string), 6);
  const capacity = dataCodewords(version) * 8;
  put(0, Math.min(4, capacity - bits.length));
  put(0, (8 - (bits.length % 8)) % 8);
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) bytes.push(bits.slice(i, i + 8).reduce((byte, bit) => (byte << 1) | bit, 0));
  for (let pad = 0xec; bytes.length < capacity / 8; pad ^= 0xec ^ 0x11) bytes.push(pad);
  return bytes;
}

/** GF(256) multiplication under the QR code's polynomial, x^8 + x^4 + x^3 + x^2 + 1. */
function multiply(x: number, y: number): number {
  let product = 0;
  for (let i = 7; i >= 0; i--) {
    product = (product << 1) ^ ((product >>> 7) * 0x11d);
    product ^= ((y >>> i) & 1) * x;
  }
  return product;
}

/** The Reed-Solomon generator of `degree`, highest coefficient dropped. */
function generator(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = multiply(result[j] as number, root) ^ (j + 1 < degree ? (result[j + 1] as number) : 0);
    }
    root = multiply(root, 0x02);
  }
  return result;
}

function remainder(data: readonly number[], divisor: readonly number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coefficient, i) => {
      result[i] = (result[i] as number) ^ multiply(coefficient, factor);
    });
  }
  return result;
}

/** The data split into blocks, each followed by its error correction, interleaved as the code carries them. */
function interleave(data: readonly number[], version: number): number[] {
  const [total, ecc, count] = levelH[version - 1] as readonly [number, number, number];
  const shortBlocks = count - (total % count);
  const shortLength = Math.floor(total / count);
  const divisor = generator(ecc);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < count; i++) {
    const length = shortLength - ecc + (i < shortBlocks ? 0 : 1);
    const block = data.slice(k, k + length);
    k += length;
    const correction = remainder(block, divisor);
    if (i < shortBlocks) block.push(0);
    blocks.push([...block, ...correction]);
  }
  const result: number[] = [];
  for (let i = 0; i < (blocks[0] as number[]).length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortLength - ecc || j >= shortBlocks) result.push(block[i] as number);
    });
  }
  return result;
}

const masks: readonly ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** A grid being drawn: the modules, and which of them are fixed patterns no mask touches. */
class Grid {
  readonly size: number;
  readonly dark: boolean[][];
  readonly fixed: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.dark = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }

  set(x: number, y: number, dark: boolean): void {
    (this.dark[y] as boolean[])[x] = dark;
    (this.fixed[y] as boolean[])[x] = true;
  }

  copy(): Grid {
    const grid = new Grid(this.size);
    this.dark.forEach((row, y) => row.forEach((dark, x) => ((grid.dark[y] as boolean[])[x] = dark)));
    this.fixed.forEach((row, y) => row.forEach((fixed, x) => ((grid.fixed[y] as boolean[])[x] = fixed)));
    return grid;
  }
}

function drawPatterns(grid: Grid, version: number): void {
  const size = grid.size;
  for (let i = 0; i < size; i++) {
    grid.set(6, i, i % 2 === 0);
    grid.set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        if (x >= 0 && x < size && y >= 0 && y < size) grid.set(x, y, distance !== 2 && distance !== 4);
      }
    }
  }
  const centres = alignment[version - 1] as readonly number[];
  const last = centres.length - 1;
  centres.forEach((cx, i) =>
    centres.forEach((cy, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) grid.set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }),
  );
  drawFormat(grid, 0);
  if (version >= 7) {
    let rest = version;
    for (let i = 0; i < 12; i++) rest = (rest << 1) ^ ((rest >>> 11) * 0x1f25);
    const bits = (version << 12) | rest;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      grid.set(a, b, dark);
      grid.set(b, a, dark);
    }
  }
}

function drawFormat(grid: Grid, mask: number): void {
  const size = grid.size;
  const data = (levelHBits << 3) | mask;
  let rest = data;
  for (let i = 0; i < 10; i++) rest = (rest << 1) ^ ((rest >>> 9) * 0x537);
  const bits = ((data << 10) | rest) ^ 0x5412;
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i++) grid.set(8, i, bit(i));
  grid.set(8, 7, bit(6));
  grid.set(8, 8, bit(7));
  grid.set(7, 8, bit(8));
  for (let i = 9; i < 15; i++) grid.set(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) grid.set(size - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) grid.set(8, size - 15 + i, bit(i));
  grid.set(8, size - 8, true);
}

function drawCodewords(grid: Grid, codewords: readonly number[]): void {
  const size = grid.size;
  let i = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        if (!(grid.fixed[y] as boolean[])[x] && i < codewords.length * 8) {
          (grid.dark[y] as boolean[])[x] = (((codewords[i >>> 3] as number) >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
}

function applyMask(grid: Grid, mask: number): void {
  const masked = masks[mask] as (x: number, y: number) => boolean;
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      if (!(grid.fixed[y] as boolean[])[x] && masked(x, y)) (grid.dark[y] as boolean[])[x] = !(grid.dark[y] as boolean[])[x];
    }
  }
}

/** The standard's four penalty rules: long runs, 2×2 blocks, finder look-alikes, and imbalance of dark and light. */
function penalty(grid: Grid): number {
  const size = grid.size;
  const at = (x: number, y: number) => (grid.dark[y] as boolean[])[x] as boolean;
  let score = 0;
  for (const horizontal of [true, false]) {
    for (let a = 0; a < size; a++) {
      let run = 1;
      for (let b = 1; b <= size; b++) {
        const same = b < size && (horizontal ? at(b, a) === at(b - 1, a) : at(a, b) === at(a, b - 1));
        if (same) run++;
        else {
          if (run >= 5) score += 3 + run - 5;
          run = 1;
        }
      }
      for (let b = 0; b + 10 < size; b++) {
        const line = Array.from({ length: 11 }, (_, k) => (horizontal ? at(b + k, a) : at(a, b + k)));
        const finder = [true, false, true, true, true, false, true];
        const before = finder.every((dark, k) => line[k + 4] === dark) && line.slice(0, 4).every((dark) => !dark);
        const after = finder.every((dark, k) => line[k] === dark) && line.slice(7).every((dark) => !dark);
        if (before) score += 40;
        if (after) score += 40;
      }
    }
  }
  let darkCount = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (at(x, y)) darkCount++;
      if (x + 1 < size && y + 1 < size && at(x, y) === at(x + 1, y) && at(x, y) === at(x, y + 1) && at(x, y) === at(x + 1, y + 1)) {
        score += 3;
      }
    }
  }
  score += 10 * Math.floor(Math.abs((darkCount * 100) / (size * size) - 50) / 5);
  return score;
}

/**
 * `text` as a QR code at error-correction level H (MM-697), in the alphanumeric mode: digits, capital letters and
 * ` $%*+-./:`. The smallest version from 1 to 10 that holds it, with the mask the standard's penalty prefers. It
 * fails on a character outside that set, or on text too long for version 10.
 */
export function encodeQr(text: string): QrMatrix {
  for (const character of text) {
    if (!alphabet.includes(character)) throw new Error(`A QR code in the alphanumeric mode cannot hold "${character}".`);
  }
  const bitsFor = (version: number) => 4 + (version < 10 ? 9 : 11) + 11 * Math.floor(text.length / 2) + 6 * (text.length % 2);
  const version = levelH.findIndex((_, i) => bitsFor(i + 1) <= dataCodewords(i + 1) * 8) + 1;
  if (version === 0) throw new Error('The text is too long for a QR code of version 10 at level H.');
  const base = new Grid(version * 4 + 17);
  drawPatterns(base, version);
  drawCodewords(base, interleave(encodeData(text, version), version));
  let best: Grid | undefined;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const grid = base.copy();
    applyMask(grid, mask);
    drawFormat(grid, mask);
    const score = penalty(grid);
    if (score < bestScore) {
      best = grid;
      bestScore = score;
    }
  }
  const chosen = best as Grid;
  return { size: chosen.size, version, dark: chosen.dark };
}
