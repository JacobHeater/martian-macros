import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-387: both shells fetch a pack file into its partial natively and tell
 * the app only counts. CI builds no iOS app, so this reads the plugins'
 * source: each offers `httpGetToFile`, and no `packFileProgress` event it
 * sends carries data.
 */
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmPacksPlugin.kt', 'utf8');
const swift = readFileSync('ios/App/App/Plugins/MmPacksPlugin.swift', 'utf8');

it('both plugins offer httpGetToFile', () => {
  expect(kotlin).toMatch(/@PluginMethod\s+fun httpGetToFile\(/);
  expect(swift).toContain('CAPPluginMethod(name: "httpGetToFile", returnType: CAPPluginReturnPromise)');
  expect(swift).toMatch(/@objc func httpGetToFile\(/);
});

it('no packFileProgress event carries the bytes', () => {
  const sendsOfKotlin = [...kotlin.matchAll(/notifyListeners\("packFileProgress",[^\n]*/g)].map((match) => match[0]);
  expect(sendsOfKotlin.length).toBeGreaterThan(0);
  for (const send of sendsOfKotlin) expect(send).not.toMatch(/"data"|Base64/);
  const swiftTransfer = swift.slice(swift.indexOf('private final class PackFileTransfer'), swift.indexOf('enum Gunzip'));
  expect(swiftTransfer).toContain('fileProgress(');
  expect(swiftTransfer).not.toMatch(/"data"|base64/);
});
