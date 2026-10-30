import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { encodeQr } from '../../src/lang/encodeQr';
import type { QrMatrix } from '../../src/lang/QrMatrix';
import { qrLogoArea } from '../../src/lang/qrLogoArea';
import { MoveCode } from '../../src/transfer/MoveCode';

/**
 * MM-695: the app draws its own QR codes. Each is read back by an independent decoder (jsQR), as a camera would read
 * the screen: once plain, once with the logo's square left light, and once with that square filled dark, worse than
 * any icon drawn there.
 */
const scale = 4;
const quiet = 4;

function pixels(code: QrMatrix, logo: 'none' | 'light' | 'dark'): { data: Uint8ClampedArray; side: number } {
  const area = qrLogoArea(code.size);
  const inLogo = (x: number, y: number) => x >= area.from && x < area.from + area.span && y >= area.from && y < area.from + area.span;
  // The light square keeps a light border a module wide; inside it, worst case, everything dark.
  const inIcon = (x: number, y: number) =>
    x > area.from && x < area.from + area.span - 1 && y > area.from && y < area.from + area.span - 1;
  const side = (code.size + quiet * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4);
  for (let py = 0; py < side; py++) {
    for (let px = 0; px < side; px++) {
      const x = Math.floor(px / scale) - quiet;
      const y = Math.floor(py / scale) - quiet;
      let dark = x >= 0 && y >= 0 && x < code.size && y < code.size && (code.dark[y]?.[x] ?? false);
      if (logo !== 'none' && inLogo(x, y)) dark = logo === 'dark' && inIcon(x, y);
      const value = dark ? 0 : 255;
      const at = (py * side + px) * 4;
      data[at] = value;
      data[at + 1] = value;
      data[at + 2] = value;
      data[at + 3] = 255;
    }
  }
  return { data, side };
}

const read = (code: QrMatrix, logo: 'none' | 'light' | 'dark') => {
  const { data, side } = pixels(code, logo);
  return jsQR(data, side, side, { inversionAttempts: 'dontInvert' })?.data;
};

/** The format information's error-correction level, read off the second copy beside the finders. */
function levelOf(code: QrMatrix): string {
  const size = code.size;
  let bits = 0;
  for (let i = 0; i < 8; i++) if (code.dark[8]?.[size - 1 - i]) bits |= 1 << i;
  for (let i = 8; i < 15; i++) if (code.dark[size - 15 + i]?.[8]) bits |= 1 << i;
  return ['M', 'L', 'H', 'Q'][((bits ^ 0x5412) >>> 13) & 3] as string;
}

const moveCodes = [
  new MoveCode({ host: '192.168.1.24', port: 47_310 }, new Uint8Array(32).fill(7)).toText(),
  new MoveCode({ host: '10.0.0.2', port: 1 }, new Uint8Array(32).map((_, i) => i * 8)).toText(),
  new MoveCode({ host: '255.255.255.255', port: 65_535 }, new Uint8Array(32).fill(255)).toText(),
  new MoveCode({ host: '172.16.254.3', port: 8_080 }, new Uint8Array(32).map((_, i) => (i * 37 + 11) % 256)).toText(),
];

describe('a QR code the app draws', () => {
  it.each(['HELLO WORLD', '0123456789', 'A', 'MM-695 $%*+-./:', ...moveCodes])('reads back as %s', (text) => {
    expect(read(encodeQr(text), 'none')).toBe(text);
  });

  it.each(moveCodes)('reads back with its logo, light or dark: %s', (text) => {
    const code = encodeQr(text);
    expect(read(code, 'light')).toBe(text);
    expect(read(code, 'dark')).toBe(text);
  });

  it('uses error-correction level H', () => {
    for (const text of ['A', 'HELLO WORLD', ...moveCodes]) expect(levelOf(encodeQr(text))).toBe('H');
  });

  it('keeps the logo within a fifth of the code', () => {
    for (const text of ['A', ...moveCodes]) {
      const code = encodeQr(text);
      const { span } = qrLogoArea(code.size);
      expect(span * span).toBeLessThanOrEqual((code.size * code.size) / 5);
    }
  });

  it('carries a move code in version 6', () => {
    expect(encodeQr(moveCodes[0] as string).version).toBe(6);
  });

  it('reads back at the largest version it draws', () => {
    const longest = 'A'.repeat(174);
    const code = encodeQr(longest);
    expect(code.version).toBe(10);
    expect(read(code, 'none')).toBe(longest);
  });

  it('refuses a character outside the alphanumeric set, and text too long for version 10', () => {
    expect(() => encodeQr('lower case')).toThrow();
    expect(() => encodeQr('A'.repeat(175))).toThrow();
  });
});
