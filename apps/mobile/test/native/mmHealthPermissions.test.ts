import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-323: once Health Connect stops asking, the app says where to allow a
 * kind and opens it. No device runs in CI, so this reads the plugins'
 * source: Android tells a request answered from one never shown and opens
 * the app's own page of Health Connect; the iPhone has none to open.
 */
const kotlin = readFileSync('android/app/src/main/java/com/martianmacros/MmHealthPlugin.kt', 'utf8');
const swift = readFileSync('ios/App/App/Plugins/MmHealthPlugin.swift', 'utf8');

it('both plugins offer openPermissions', () => {
  expect(kotlin).toMatch(/@PluginMethod\s+fun openPermissions\(/);
  expect(swift).toContain('CAPPluginMethod(name: "openPermissions", returnType: CAPPluginReturnPromise)');
  expect(swift).toMatch(/@objc func openPermissions\(/);
});

it('Android says whether the question was shown, and opens the app’s own page of Health Connect', () => {
  expect(kotlin).toContain('.put("shown", shown)');
  // An answer back sooner than 0.8 s was never shown; a person reading the question takes longer (MM-323 Decisions).
  expect(kotlin).toMatch(/unshownWithinMs = 800L/);
  expect(kotlin).toContain('>= unshownWithinMs');
  expect(kotlin).toContain('android.health.connect.action.MANAGE_HEALTH_PERMISSIONS');
  expect(kotlin).toContain('putExtra(Intent.EXTRA_PACKAGE_NAME, context.packageName)');
  expect(kotlin).toContain('HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS');
});

it('the iPhone has no such page to open', () => {
  expect(swift).toContain('call.resolve(["opened": false])');
});
