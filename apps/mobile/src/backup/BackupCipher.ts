import type { BackupKdf } from './BackupKdf';

/**
 * The cryptography a backup needs (MM-63): a key from a passphrase
 * (Argon2id) and an authenticated cipher (XChaCha20-Poly1305), behind one
 * interface so the format is tested apart from the library.
 */
export interface BackupCipher {
  /** A fresh salt and the parameters this device uses. */
  newKdf(): Promise<BackupKdf>;
  /** The nonce length the cipher needs. */
  readonly nonceBytes: number;
  randomBytes(count: number): Promise<Uint8Array>;
  deriveKey(passphrase: string, kdf: BackupKdf): Promise<Uint8Array>;
  /** Encrypts `plain`, binding `additional` so a change to it is detected. */
  seal(plain: Uint8Array, nonce: Uint8Array, key: Uint8Array, additional: Uint8Array): Promise<Uint8Array>;
  /** The plain bytes, or undefined when the key is wrong or anything was changed. */
  open(sealed: Uint8Array, nonce: Uint8Array, key: Uint8Array, additional: Uint8Array): Promise<Uint8Array | undefined>;
}
