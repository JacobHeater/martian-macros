import { base32OfBytes } from '../lang/base32OfBytes';
import { bytesOfBase32 } from '../lang/bytesOfBase32';
import type { LinkAddress } from './LinkAddress';

/** What every move code starts with: the app's mark and the code's format. */
const prefix = 'MMMOVE1:';
const keyBytes = 32;

/**
 * What the receiving phone's QR code carries (MM-695): where it listens and the one-time key, as 38 bytes (an IPv4
 * address, a port, the key) in base32 after a prefix. Base32 keeps every character in the QR code's alphanumeric
 * set, so the code stays small enough to scan easily with a logo in its middle.
 */
export class MoveCode {
  readonly address: LinkAddress;
  readonly key: Uint8Array;

  constructor(address: LinkAddress, key: Uint8Array) {
    const parts = address.host.split('.').map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      throw new Error(`"${address.host}" is not an IPv4 address.`);
    }
    if (!Number.isInteger(address.port) || address.port < 1 || address.port > 65535) throw new Error(`${address.port} is not a port.`);
    if (key.length !== keyBytes) throw new Error(`A move key is ${keyBytes} bytes.`);
    this.address = address;
    this.key = key;
  }

  toText(): string {
    const bytes = new Uint8Array(4 + 2 + keyBytes);
    bytes.set(this.address.host.split('.').map(Number), 0);
    bytes[4] = this.address.port >>> 8;
    bytes[5] = this.address.port & 0xff;
    bytes.set(this.key, 6);
    return prefix + base32OfBytes(bytes);
  }

  /** The code `text` holds, or undefined when it is not a move code (a product's barcode, another app's QR code). */
  static parse(text: string): MoveCode | undefined {
    if (!text.startsWith(prefix)) return undefined;
    let bytes: Uint8Array;
    try {
      bytes = bytesOfBase32(text.slice(prefix.length));
    } catch {
      return undefined;
    }
    if (bytes.length !== 4 + 2 + keyBytes) return undefined;
    const host = [...bytes.subarray(0, 4)].join('.');
    const port = ((bytes[4] as number) << 8) | (bytes[5] as number);
    try {
      return new MoveCode({ host, port }, bytes.slice(6));
    } catch {
      return undefined;
    }
  }
}
