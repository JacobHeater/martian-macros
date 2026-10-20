import { describe, expect, it } from 'vitest';
import { BackupFile } from '../../src/backup/BackupFile';
import { BackupProblem } from '../../src/backup/BackupProblem';
import { SodiumBackupCipher } from '../../src/backup/SodiumBackupCipher';

/**
 * MM-63: a backup round-trips under its passphrase; the wrong passphrase and
 * a changed byte are refused; nothing readable from the person's data is
 * outside the sealed part; a file that is no backup is told apart.
 */
const cipher = new SodiumBackupCipher();
const snapshot = new TextEncoder().encode('SQLite format 3\0 Jacob weighed 82.4 kg on 2026-10-05 and ate oats');
const made = { schemaVersion: 10, createdOn: '2026-10-19' };

describe('a backup file', () => {
  it('round-trips under its passphrase, and its header says what it is', async () => {
    const file = await BackupFile.write(snapshot, 'correct horse battery', made, cipher);
    const header = BackupFile.header(file);
    expect(header).toMatchObject({ format: 1, app: 'martian-macros', schemaVersion: 10, createdOn: '2026-10-19' });
    expect(header.kdf.algorithm).toBe('argon2id13');
    const opened = await BackupFile.read(file, 'correct horse battery', cipher);
    expect(opened.snapshot).toEqual(snapshot);
  }, 60000);

  it('refuses the wrong passphrase and a changed byte, and tells a file that is no backup apart', async () => {
    const file = await BackupFile.write(snapshot, 'correct horse battery', made, cipher);
    await expect(BackupFile.read(file, 'incorrect horse battery', cipher)).rejects.toMatchObject({ kind: 'wrongPassphrase' });
    const tampered = new Uint8Array(file);
    tampered[tampered.length - 5] = (tampered[tampered.length - 5] ?? 0) ^ 0x01;
    await expect(BackupFile.read(tampered, 'correct horse battery', cipher)).rejects.toBeInstanceOf(BackupProblem);
    const headerChanged = new Uint8Array(file);
    const at = new TextDecoder().decode(file).indexOf('2026-10-19');
    headerChanged[at + 9] = 0x38; // the day in the header altered: the header is bound to the sealed part
    await expect(BackupFile.read(headerChanged, 'correct horse battery', cipher)).rejects.toBeInstanceOf(BackupProblem);
    expect(() => BackupFile.header(new TextEncoder().encode('%PDF-1.7 not a backup at all'))).toThrow(/not a Martian Macros backup/);
  }, 60000);

  it('keeps nothing readable from the data outside the sealed part', async () => {
    const file = await BackupFile.write(snapshot, 'correct horse battery', made, cipher);
    const text = new TextDecoder('utf-8', { fatal: false }).decode(file);
    for (const word of ['Jacob', '82.4', '2026-10-05', 'oats', 'SQLite']) expect(text).not.toContain(word);
    expect(text).toContain('martian-macros');
  }, 60000);
});
