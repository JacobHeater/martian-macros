import sodium from 'libsodium-wrappers-sumo';
import { base64OfBytes } from '../lang/base64OfBytes';
import { bytesOfBase64 } from '../lang/bytesOfBase64';
import type { BackupCipher } from './BackupCipher';
import type { BackupKdf } from './BackupKdf';

/** The same bytes as a view in this realm: libsodium refuses a typed array from another one (a WebView frame, a test's document). */
const local = (bytes: Uint8Array): Uint8Array => new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);

/**
 * libsodium's Argon2id and XChaCha20-Poly1305 (MM-63). The interactive
 * limits: a phone derives the key in about a second, which a backup made by
 * hand can afford; an attacker with the file still faces Argon2id.
 */
export class SodiumBackupCipher implements BackupCipher {
  readonly nonceBytes = 24;

  private async ready(): Promise<typeof sodium> {
    await sodium.ready;
    return sodium;
  }

  async newKdf(): Promise<BackupKdf> {
    const s = await this.ready();
    return {
      algorithm: 'argon2id13',
      opsLimit: s.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      memLimit: s.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      salt: base64OfBytes(s.randombytes_buf(s.crypto_pwhash_SALTBYTES)),
    };
  }

  async randomBytes(count: number): Promise<Uint8Array> {
    return (await this.ready()).randombytes_buf(count);
  }

  async deriveKey(passphrase: string, kdf: BackupKdf): Promise<Uint8Array> {
    const s = await this.ready();
    return s.crypto_pwhash(
      s.crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
      passphrase,
      local(bytesOfBase64(kdf.salt)),
      kdf.opsLimit,
      kdf.memLimit,
      s.crypto_pwhash_ALG_ARGON2ID13,
    );
  }

  async seal(plain: Uint8Array, nonce: Uint8Array, key: Uint8Array, additional: Uint8Array): Promise<Uint8Array> {
    const s = await this.ready();
    return s.crypto_aead_xchacha20poly1305_ietf_encrypt(local(plain), local(additional), null, local(nonce), local(key));
  }

  async open(sealed: Uint8Array, nonce: Uint8Array, key: Uint8Array, additional: Uint8Array): Promise<Uint8Array | undefined> {
    const s = await this.ready();
    try {
      return s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, local(sealed), local(additional), local(nonce), local(key));
    } catch {
      return undefined;
    }
  }
}
