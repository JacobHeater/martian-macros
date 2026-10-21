import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MM-404: the phone's storage on iOS. CI builds no iOS app, so this reads
 * the Swift source: the Swift twins of `MmDb` and `MmPacks` offer what the
 * Kotlin ones do, keep the app's files under Application Support and out
 * of backups, run each database's calls in order, carry values across the
 * bridge as Android does, and fetch a pack as the ticket decided.
 */
const read = (path: string) => readFileSync(path, 'utf8');
const kotlinOf = (name: string) => read(`android/app/src/main/java/com/martianmacros/${name}.kt`);
const files = read('ios/App/App/Plugins/MmFiles.swift');
const db = read('ios/App/App/Plugins/MmDbPlugin.swift');
const packs = read('ios/App/App/Plugins/MmPacksPlugin.swift');

describe.each([
  ['MmDbPlugin', db],
  ['MmPacksPlugin', packs],
])('%s', (name, swift) => {
  it('offers every method of its Kotlin twin', () => {
    const methods = [...kotlinOf(name).matchAll(/@PluginMethod\s+fun (\w+)\(/g)].map((m) => m[1]);
    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) {
      expect(swift).toContain(`CAPPluginMethod(name: "${method}", returnType: CAPPluginReturnPromise)`);
      expect(swift).toMatch(new RegExp(`@objc func ${method}\\(`));
    }
  });
});

describe('where the files are', () => {
  it('is Library/Application Support, never Documents, kept out of backups', () => {
    expect(files).toContain('.applicationSupportDirectory');
    expect(files).toContain('values.isExcludedFromBackup = true');
    for (const swift of [files, db, packs]) expect(swift).not.toContain('.documentDirectory');
  });

  it('puts the database in databases/ and marks the file itself too', () => {
    expect(files).toContain('supportDirectory("databases")');
    expect(db).toContain('try MmFiles.databasePath(name)');
    expect(db).toContain('if ownFile { try? MmFiles.excludeFromBackup(path) }');
  });

  it('puts the packs in food_packs/', () => {
    expect(packs).toContain('MmFiles.supportDirectory("food_packs")');
  });
});

describe('the database', () => {
  it('runs every call of one database on its own serial queue', () => {
    expect(db).toMatch(/let queue = DispatchQueue\(label: "mm-db-\\\(path\)"\)/);
    expect(db).not.toMatch(/DispatchQueue\([^)]*attributes: \.concurrent/);
    expect(db).toContain('db.queue.async');
  });

  it('carries a blob as { $blob: base64 } both ways', () => {
    expect(db).toContain('object["$blob"] as? String');
    expect(db).toContain('["$blob": data.base64EncodedString()] as JSObject');
  });

  it('refuses a whole number larger than JavaScript holds exactly', () => {
    const limit = /private let maxExact: Int64 = ([\d_]+)/.exec(db)?.[1]?.replace(/_/g, '');
    expect(Number(limit)).toBe(Number.MAX_SAFE_INTEGER);
    expect(db).toContain('if number > maxExact || number < -maxExact {');
  });

  it('splits a script outside strings, quoted names and comments', () => {
    expect(db).toContain('Self.statementsOf(call.getString("sql") ?? "")');
    expect(db).toMatch(/case "'", "\\"":/);
  });
});

describe('the pack fetch', () => {
  it('sends no cookies, keeps no cache, and resumes with a Range header', () => {
    expect(packs).toContain('URLSessionConfiguration.ephemeral');
    expect(packs).toContain('configuration.httpShouldSetCookies = false');
    expect(packs).toContain('configuration.httpCookieAcceptPolicy = .never');
    expect(packs).toContain('configuration.urlCache = nil');
    expect(packs).toContain('urlRequest.setValue("bytes=\\(start)-", forHTTPHeaderField: "Range")');
  });

  it('waits 20 s to connect and 30 s between bytes', () => {
    expect(packs).toContain('URLRequest(url: url, timeoutInterval: 20)');
    expect(packs).toContain('configuration.timeoutIntervalForRequest = 30');
  });

  it('checks a partial with SHA-256 and unpacks gzip as a stream', () => {
    expect(packs).toContain('var hasher = SHA256()');
    expect(packs).toContain('compression_stream_init(&stream, COMPRESSION_STREAM_DECODE, COMPRESSION_ZLIB)');
    expect(packs).toContain('notifyListeners("packHttpChunk"');
  });
});
