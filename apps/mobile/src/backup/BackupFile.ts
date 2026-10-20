import type { BackupCipher } from './BackupCipher';
import type { BackupHeader } from './BackupHeader';
import { BackupProblem } from './BackupProblem';

const magic = new Uint8Array([0x4d, 0x4d, 0x42, 0x4b]); // "MMBK"
const formatVersion = 1;

/**
 * The backup file's layout (MM-63): "MMBK", one byte of format version, the
 * header's length, the header as JSON, the nonce, then the database sealed
 * with the header bound to it, so a changed header is refused too. Nothing
 * readable from the person's data is outside the sealed part.
 */
export const BackupFile = {
  /** Encrypts `snapshot` under `passphrase` into a file. */
  async write(
    snapshot: Uint8Array,
    passphrase: string,
    { schemaVersion, createdOn }: { schemaVersion: number; createdOn: string },
    cipher: BackupCipher,
  ): Promise<Uint8Array> {
    const kdf = await cipher.newKdf();
    const header: BackupHeader = { format: 1, app: 'martian-macros', schemaVersion, createdOn, kdf };
    const headerBytes = new TextEncoder().encode(JSON.stringify(header));
    const nonce = await cipher.randomBytes(cipher.nonceBytes);
    const key = await cipher.deriveKey(passphrase, kdf);
    const sealed = await cipher.seal(snapshot, nonce, key, headerBytes);
    const out = new Uint8Array(magic.length + 1 + 4 + headerBytes.length + nonce.length + sealed.length);
    let at = 0;
    out.set(magic, at);
    at += magic.length;
    out[at++] = formatVersion;
    new DataView(out.buffer).setUint32(at, headerBytes.length);
    at += 4;
    out.set(headerBytes, at);
    at += headerBytes.length;
    out.set(nonce, at);
    at += nonce.length;
    out.set(sealed, at);
    return out;
  },

  /** The header alone, without a passphrase: what the file says it is. */
  header(file: Uint8Array): BackupHeader {
    if (file.length < magic.length + 5 || magic.some((byte, at) => file[at] !== byte)) throw new BackupProblem('notABackup');
    const version = file[magic.length];
    if (version === undefined || version > formatVersion) throw new BackupProblem('newerFormat');
    const length = new DataView(file.buffer, file.byteOffset).getUint32(magic.length + 1);
    const start = magic.length + 5;
    if (start + length > file.length) throw new BackupProblem('notABackup');
    try {
      const header = JSON.parse(new TextDecoder().decode(file.subarray(start, start + length))) as BackupHeader;
      if (header.app !== 'martian-macros' || header.format !== 1 || typeof header.schemaVersion !== 'number') throw new Error();
      return header;
    } catch {
      throw new BackupProblem('notABackup');
    }
  },

  /** The database inside `file`, or a `BackupProblem`: wrong passphrase and a changed file are told apart from a file that is no backup. */
  async read(file: Uint8Array, passphrase: string, cipher: BackupCipher): Promise<{ header: BackupHeader; snapshot: Uint8Array }> {
    const header = BackupFile.header(file);
    const length = new DataView(file.buffer, file.byteOffset).getUint32(magic.length + 1);
    const headerStart = magic.length + 5;
    const headerBytes = file.subarray(headerStart, headerStart + length);
    const nonceStart = headerStart + length;
    const nonce = file.subarray(nonceStart, nonceStart + cipher.nonceBytes);
    const sealed = file.subarray(nonceStart + cipher.nonceBytes);
    if (nonce.length < cipher.nonceBytes || sealed.length === 0) throw new BackupProblem('notABackup');
    const key = await cipher.deriveKey(passphrase, header.kdf);
    const snapshot = await cipher.open(sealed, nonce, key, headerBytes);
    if (snapshot !== undefined) return { header, snapshot };
    // The cipher cannot tell a wrong key from a changed byte; a passphrase that opened nothing is the likelier, so the
    // person is asked again, and a file whose sealed part was changed is caught when the database inside is opened.
    throw new BackupProblem('wrongPassphrase');
  },
};
