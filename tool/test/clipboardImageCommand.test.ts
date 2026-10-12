import assert from 'node:assert/strict';
import { test } from 'node:test';
import { clipboardImageCommand } from '../src/android.ts';

/** MM-238: `mm screenshot --clipboard` puts the image on the clipboard, each platform its own way. */
test('Windows sets the image through PowerShell, in a single-threaded apartment', () => {
  const command = clipboardImageCommand('win32', 'C:\\Temp\\shot.png')!;
  assert.deepEqual(command.slice(0, 4), ['powershell', '-NoProfile', '-STA', '-Command']);
  assert.match(command[4]!, /FromFile\('C:\\Temp\\shot\.png'\)/);
  assert.match(command[4]!, /Clipboard\]::SetImage/);
});

test('a quote in a Windows path cannot end the string it is written in', () => {
  const command = clipboardImageCommand('win32', "C:\\Temp\\it's.png")!;
  assert.match(command[4]!, /FromFile\('C:\\Temp\\it''s\.png'\)/);
});

test('macOS and Linux have their own tools, and the path is one argument', () => {
  assert.equal(clipboardImageCommand('darwin', '/tmp/shot.png')![0], 'osascript');
  assert.deepEqual(clipboardImageCommand('linux', '/tmp/a b.png'), [
    'xclip',
    '-selection',
    'clipboard',
    '-t',
    'image/png',
    '-i',
    '/tmp/a b.png',
  ]);
});

test('a platform with no known way says so by giving nothing', () => {
  assert.equal(clipboardImageCommand('aix', '/tmp/shot.png'), undefined);
});
