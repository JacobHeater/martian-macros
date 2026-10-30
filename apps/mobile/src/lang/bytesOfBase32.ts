import { FormatError } from './FormatError';

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** The bytes `base32OfBytes` wrote (MM-698). Fails on any other letter. */
export function bytesOfBase32(text: string): Uint8Array {
  const bytes: number[] = [];
  let buffer = 0;
  let held = 0;
  for (const letter of text) {
    const value = letters.indexOf(letter);
    if (value < 0) throw new FormatError(`"${letter}" is not a base32 letter.`);
    buffer = ((buffer << 5) | value) & 0xfff;
    held += 5;
    if (held >= 8) {
      bytes.push((buffer >>> (held - 8)) & 0xff);
      held -= 8;
    }
  }
  return new Uint8Array(bytes);
}
