import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { Phone } from '../src/ios.ts';
import { phoneScreenshot } from '../src/phoneScreenshot.ts';
import { phoneScreenshotCommands } from '../src/phoneScreenshotCommands.ts';
import type { Captured } from '../src/proc.ts';
import { screenshotArgs } from '../src/screenshotArgs.ts';
import { screenshotTarget } from '../src/screenshotTarget.ts';

/** MM-536: `mm screenshot --phone` asks the dev app on the iPhone for a picture of itself, through devicectl alone. */
const phone: Phone = { id: 'AAAAAAAA-0000-1111-2222-333333333333', name: 'Test iPhone', model: 'iPhone 15', osVersion: '26.3', connected: true };
const simulator = '0D4C5F2A-1B3E-4C6D-8E9F-A1B2C3D4E5F6';
const ok: Captured = { code: 0, stdout: '', stderr: '' };
const failed: Captured = { code: 1, stdout: '', stderr: 'ERROR: not there' };

test('--phone takes no value, so a path after it is a path; -d and --env values are not paths', () => {
  assert.deepEqual(screenshotArgs(['--phone', 'shot.png', '--clipboard']), {
    device: undefined,
    phone: true,
    identity: 'dev',
    out: 'shot.png',
    clipboard: true,
  });
  assert.deepEqual(screenshotArgs(['-d', 'Test iPhone', '--env', 'demo', 'a.png']), {
    device: 'Test iPhone',
    phone: false,
    identity: 'demo',
    out: 'a.png',
    clipboard: false,
  });
  assert.equal(screenshotArgs(['--phone', '--prod']).identity, 'prod');
  assert.equal(screenshotArgs(['--phone', '--env', 'prod']).identity, 'prod');
  assert.equal(screenshotArgs(['--phone']).out, undefined);
});

test('a paired iPhone by name or id is the phone, before a simulator UDID; anything else is adb', () => {
  assert.equal(screenshotTarget(undefined, true, []), 'phone');
  assert.equal(screenshotTarget('Test iPhone', false, [phone]), 'phone');
  assert.equal(screenshotTarget(phone.id, false, [phone]), 'phone');
  assert.equal(screenshotTarget(simulator, false, [phone]), 'simulator');
  assert.equal(screenshotTarget(simulator, false, []), 'simulator');
  assert.equal(screenshotTarget('emulator-5554', false, [phone]), 'android');
  assert.equal(screenshotTarget(undefined, false, [phone]), 'android');
});

test('the devicectl command lines: the request in, the app opened without a restart, the nudge, the picture out', () => {
  const commands = phoneScreenshotCommands(phone.id, 'com.martianmacros.dev', '20261021-101500');
  const container = ['--domain-type', 'appDataContainer', '--domain-identifier', 'com.martianmacros.dev'];
  assert.deepEqual(commands.request('/tmp/r'), [
    'xcrun', 'devicectl', 'device', 'copy', 'to', '--device', phone.id,
    '--source', '/tmp/r', '--destination', 'Library/Caches/mm-screenshot-20261021-101500.request', ...container,
  ]);
  assert.deepEqual(commands.open, ['xcrun', 'devicectl', 'device', 'process', 'launch', '--device', phone.id, 'com.martianmacros.dev']);
  assert.ok(!commands.open.includes('--terminate-existing'), 'the screen being shown is the one pictured');
  assert.deepEqual(commands.nudge, [
    'xcrun', 'devicectl', 'device', 'notification', 'post', '--device', phone.id, '--name', 'com.martianmacros.dev.mm-screenshot',
  ]);
  assert.deepEqual(commands.fetch('/tmp/out.png'), [
    'xcrun', 'devicectl', 'device', 'copy', 'from', '--device', phone.id,
    '--source', 'Library/Caches/mm-screenshot-20261021-101500.png', '--destination', '/tmp/out.png', ...container,
  ]);
});

/** A run of `phoneScreenshot` against a fake devicectl and clock; `fetches` says which copy-outs bring the picture. */
async function attempt({
  identity = 'dev',
  chosen = phone,
  answers = {},
  pictureOnFetch = 3,
}: {
  identity?: string;
  chosen?: Phone | string;
  answers?: Partial<Record<'to' | 'launch', Captured>>;
  pictureOnFetch?: number;
} = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'mm-iphone-test-'));
  const path = join(dir, 'shot.png');
  const ran: string[][] = [];
  const said: string[] = [];
  let clock = 0;
  let fetches = 0;
  let chooses = 0;
  const result = await phoneScreenshot({
    identity,
    choose: async () => {
      chooses += 1;
      return chosen;
    },
    stamp: '20261021-101500',
    path,
    capture: async (command) => {
      ran.push([...command]);
      if (command.includes('to')) return answers.to ?? ok;
      if (command.includes('launch')) return answers.launch ?? ok;
      if (command.includes('from')) {
        fetches += 1;
        if (fetches < pictureOnFetch) return failed;
        writeFileSync(command[command.indexOf('--destination') + 1]!, 'PNG');
      }
      return ok;
    },
    sleep: async (ms) => {
      clock += ms;
    },
    now: () => clock,
    say: (line) => said.push(line),
    timeoutMs: 5_000,
    pollMs: 1_000,
  });
  const written = (() => {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      return undefined;
    }
  })();
  rmSync(dir, { recursive: true, force: true });
  return { result, ran, said, fetches, chooses, written };
}

test('the real app is refused before anything is chosen or sent', async () => {
  const run = await attempt({ identity: 'prod' });
  assert.equal(run.result.code, 64);
  assert.equal(run.chooses, 0);
  assert.deepEqual(run.ran, []);
  assert.match(run.said.join('\n'), /real app \(com\.martianmacros\) takes no screenshots.*dev and demo apps only/);
});

test('a phone that is away or unpaired is said, and nothing is sent', async () => {
  const run = await attempt({ chosen: 'Test iPhone is paired but not connected. Plug it in, unlock it, and run again.' });
  assert.equal(run.result.code, 69);
  assert.deepEqual(run.ran, []);
  assert.match(run.said[0]!, /paired but not connected/);
});

test('the picture is waited for, asked again each time, and copied to the path at the first that comes back', async () => {
  const run = await attempt({ pictureOnFetch: 3 });
  assert.equal(run.result.code, 0);
  assert.equal(run.result.phone?.name, 'Test iPhone');
  assert.equal(run.written, 'PNG');
  assert.equal(run.fetches, 3);
  assert.deepEqual(
    run.ran.map((command) => command.slice(3, 5).join(' ')),
    ['copy to', 'process launch', 'notification post', 'copy from', 'notification post', 'copy from', 'notification post', 'copy from'],
  );
  assert.ok(run.ran.every((command) => command[0] === 'xcrun' && command[1] === 'devicectl'), 'devicectl alone');
});

test('no picture within the timeout stops, says why, and leaves the path alone', async () => {
  const run = await attempt({ pictureOnFetch: Number.POSITIVE_INFINITY });
  assert.equal(run.result.code, 1);
  assert.equal(run.written, undefined);
  assert.equal(run.fetches, 6, 'a try a second for five seconds, and one at the deadline');
  assert.match(run.said.join('\n'), /No picture came back from Test iPhone within 5 s\. Unlock the phone and keep Martian Macros Dev open/);
});

test('an app that is not installed is said at the first step', async () => {
  const run = await attempt({ answers: { to: failed } });
  assert.equal(run.result.code, 1);
  assert.equal(run.ran.length, 1);
  assert.match(run.said.join('\n'), /Martian Macros Dev \(com\.martianmacros\.dev\) could not be reached on Test iPhone.*\n.*Is it installed\? mm run --ios --phone --env dev/);
});

test('an app that does not come to the front is said, and the wait goes on', async () => {
  const run = await attempt({ answers: { launch: failed }, pictureOnFetch: 1 });
  assert.equal(run.result.code, 0);
  assert.match(run.said.join('\n'), /did not come to the front/);
});

test('the demo app is asked by its own id', async () => {
  const run = await attempt({ identity: 'demo', pictureOnFetch: 1 });
  assert.equal(run.result.code, 0);
  assert.ok(run.ran[0]!.includes('com.martianmacros.demo'));
});
