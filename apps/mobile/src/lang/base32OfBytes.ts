/** RFC 4648's base32 letters: every one in a QR code's alphanumeric set (MM-698). */
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** The bytes as RFC 4648 base32 without padding, so a QR code can carry them in its compact alphanumeric mode (MM-698). */
export function base32OfBytes(bytes: Uint8Array): string {
  let text = '';
  let buffer = 0;
  let held = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    held += 8;
    while (held >= 5) {
      text += letters[(buffer >>> (held - 5)) & 31];
      held -= 5;
    }
    buffer &= (1 << held) - 1;
  }
  if (held > 0) text += letters[(buffer << (5 - held)) & 31];
  return text;
}
