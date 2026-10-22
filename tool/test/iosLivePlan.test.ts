import assert from 'node:assert/strict';
import { test } from 'node:test';
import { iosLivePlan } from '../src/iosLivePlan.ts';

/**
 * MM-557: `mm run --ios --phone --live` serves the app from Vite on the
 * Mac's Wi-Fi address and points the phone's shell at it.
 */
test('the server listens on the Mac\'s Wi-Fi address only, on 5173 by default', () => {
  const plan = iosLivePlan(['--ios', '--phone', '--live'], '192.168.1.20');
  assert.ok(typeof plan !== 'string');
  assert.equal(plan.port, 5173);
  assert.equal(plan.url, 'http://192.168.1.20:5173');
  assert.deepEqual(plan.devServer, ['npx', 'vite', '--host', '192.168.1.20', '--port', '5173', '--strictPort']);
});

test('--port moves the server and the live URL together', () => {
  const plan = iosLivePlan(['--live', '--port', '5200'], '10.0.0.5');
  assert.ok(typeof plan !== 'string');
  assert.ok(plan.devServer.includes('5200'));
  assert.equal(plan.url, 'http://10.0.0.5:5200');
});

test('the synced config keeps what it had and gains the live server, in cleartext', () => {
  const plan = iosLivePlan(['--live'], '192.168.1.20');
  assert.ok(typeof plan !== 'string');
  const config = JSON.parse(plan.liveConfig('{"appId":"com.martianmacros","appName":"Martian Macros","webDir":"dist"}'));
  assert.deepEqual(config, {
    appId: 'com.martianmacros',
    appName: 'Martian Macros',
    webDir: 'dist',
    server: { url: 'http://192.168.1.20:5173', cleartext: true },
  });
});

test('a bad port or an address that is not IPv4 is a usage error', () => {
  for (const args of [['--port', 'abc'], ['--port'], ['--port', '80'], ['--port', '70000']]) {
    assert.equal(iosLivePlan(['--live', ...args], '192.168.1.20'), '--port must be a number from 1024 to 65535.', args.join(' '));
  }
  assert.equal(iosLivePlan(['--live'], ''), '"" is not an IPv4 address the phone can reach.');
});
