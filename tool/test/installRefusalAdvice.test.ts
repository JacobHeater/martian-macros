import assert from 'node:assert/strict';
import { test } from 'node:test';
import { installRefusalAdvice } from '../src/android.ts';

/** MM-697: a signature mismatch on install is explained, with both remedies; anything else is left to adb's words. */
test('a signature mismatch names the key, the app, the device and both remedies', () => {
  const output =
    'Performing Streamed Install\nadb: failed to install app-dev-debug.apk: Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package com.martianmacros.dev signatures do not match newer version;ignoring!]\n';
  const advice = installRefusalAdvice(output, 'com.martianmacros.dev', '47261FDAS00EDR');
  assert.ok(advice !== undefined);
  assert.match(advice, /different debug key/);
  assert.match(advice, /debug\.keystore/);
  assert.match(advice, /adb -s 47261FDAS00EDR uninstall com\.martianmacros\.dev/);
  assert.match(advice, /deletes|and its data/);
});

test('other failures get no advice of their own', () => {
  assert.equal(installRefusalAdvice('adb: failed to install x.apk: Failure [INSTALL_FAILED_INSUFFICIENT_STORAGE]\n', 'com.martianmacros.dev', 'x'), undefined);
  assert.equal(installRefusalAdvice('', 'com.martianmacros.dev', 'x'), undefined);
});
