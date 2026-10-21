import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MM-157, the panel's privacy findings 3, 6 and 8. CI builds no iOS app and
 * runs no device, so this reads the shells' source: Android keeps every
 * file out of its cloud backup and out of a transfer to a new phone; iOS
 * says "no lock" only for a phone with no passcode, and keeps the photo
 * database and its journals unreadable while the phone is locked.
 */
const read = (path: string) => readFileSync(path, 'utf8');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const rules = read('android/app/src/main/res/xml/data_extraction_rules.xml');
const backupPlugin = read('ios/App/App/Plugins/MmBackupPlugin.swift');
const files = read('ios/App/App/Plugins/MmFiles.swift');
const db = read('ios/App/App/Plugins/MmDbPlugin.swift');

const domains = ['root', 'file', 'database', 'sharedpref', 'external', 'device_root', 'device_file', 'device_database', 'device_sharedpref'];

describe('Android: nothing in its cloud backup or its transfer to a new phone', () => {
  it('the application names the extraction rules and keeps backup off', () => {
    const application = /<application\b[^>]*>/.exec(manifest)?.[0] ?? '';
    expect(application).toContain('android:allowBackup="false"');
    expect(application).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');
  });

  it.each(['cloud-backup', 'device-transfer'])('%s excludes every domain and includes none', (section) => {
    const body = new RegExp(`<${section}>([\\s\\S]*?)</${section}>`).exec(rules)?.[1];
    expect(body, section).toBeDefined();
    expect(body).not.toMatch(/<include\b/);
    for (const domain of domains) expect(body, domain).toMatch(new RegExp(`<exclude domain="${domain}" path="\\." />`));
  });
});

describe('iOS: the lock', () => {
  const unlock = /@objc func unlock\([\s\S]*?\n {4}\}\n/.exec(backupPlugin)?.[0] ?? '';

  it('says "no lock" only when the phone has no passcode; any other failure keeps the photos shut', () => {
    expect(unlock).not.toBe('');
    // Never a bare "noLock" for whatever stopped the lock being asked.
    expect(unlock).not.toMatch(/\["outcome": "noLock"\]/);
    expect(unlock).toMatch(/noPasscode\(problem\) \? "noLock" : "refused"/);
    expect(backupPlugin).toMatch(/LAError\.Code\.passcodeNotSet\.rawValue/);
    expect(backupPlugin).toMatch(/error\.domain == LAErrorDomain/);
  });
});

describe('iOS: the photo database is unreadable while the phone is locked', () => {
  it('is opened with Apple’s complete-unless-open flag, so each journal SQLite makes is too', () => {
    expect(files).toMatch(/sqliteProtectionUnlessOpen: Int32 = 0x0020_0000/);
    expect(db).toMatch(/if MmFiles\.isPhotoDatabase\(path\) \{ flags \|= MmFiles\.sqliteProtectionUnlessOpen \}/);
  });

  it('and the file and any journal already there are given that protection once open', () => {
    expect(files).toMatch(/FileProtectionType\.completeUnlessOpen/);
    expect(files).toMatch(/\[path, path \+ "-journal", path \+ "-wal", path \+ "-shm"\]/);
    expect(db).toMatch(/if MmFiles\.isPhotoDatabase\(path\) \{ MmFiles\.protectUnlessOpen\(path\) \}/);
  });

  it('knows the photo database by the name the app gives it', () => {
    expect(files).toMatch(/hasSuffix\("-photos"\)/);
    expect(read('src/app/openAppServices.ts')).toContain('name: `${databaseName}-photos`');
  });
});
