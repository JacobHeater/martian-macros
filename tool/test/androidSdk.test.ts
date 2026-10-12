import assert from 'node:assert/strict';
import { test } from 'node:test';
import { androidSdkFrom } from '../src/android.ts';

/**
 * MM-235: the runner finds the Android SDK by itself, so a plain shell
 * works without setting anything. The environment wins when it is set.
 */
const nothing = () => false;

test('ANDROID_HOME wins over everything', () => {
  assert.equal(
    androidSdkFrom({ ANDROID_HOME: 'D:/sdk', ANDROID_SDK_ROOT: 'E:/other', LOCALAPPDATA: 'C:/Users/x/AppData/Local' }, 'win32', () => true),
    'D:/sdk',
  );
});

test('ANDROID_SDK_ROOT is next', () => {
  assert.equal(androidSdkFrom({ ANDROID_SDK_ROOT: 'E:/other' }, 'win32', nothing), 'E:/other');
});

test('an empty variable does not count as set', () => {
  assert.equal(androidSdkFrom({ ANDROID_HOME: '', LOCALAPPDATA: 'C:/u' }, 'win32', () => true), 'C:/u/Android/Sdk');
});

test('the Windows default install location is found when nothing is set', () => {
  const exists = (path: string) => path === 'C:/Users/x/AppData/Local/Android/Sdk';
  assert.equal(androidSdkFrom({ LOCALAPPDATA: 'C:/Users/x/AppData/Local' }, 'win32', exists), 'C:/Users/x/AppData/Local/Android/Sdk');
});

test('macOS and Linux have their own defaults', () => {
  assert.equal(
    androidSdkFrom({ HOME: '/Users/x' }, 'darwin', (path) => path === '/Users/x/Library/Android/sdk'),
    '/Users/x/Library/Android/sdk',
  );
  assert.equal(androidSdkFrom({ HOME: '/home/x' }, 'linux', (path) => path === '/home/x/Android/Sdk'), '/home/x/Android/Sdk');
});

test('nowhere found means undefined, and PATH is hoped for', () => {
  assert.equal(androidSdkFrom({ LOCALAPPDATA: 'C:/u' }, 'win32', nothing), undefined);
  assert.equal(androidSdkFrom({}, 'linux', nothing), undefined);
});
