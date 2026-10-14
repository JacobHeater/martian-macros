import assert from 'node:assert/strict';
import { test } from 'node:test';
import { liveRunPlan } from '../src/liveRunPlan.ts';

/**
 * MM-300: `mm run --live` serves the app from Vite on loopback and runs
 * Capacitor's live reload against it through adb reverse on the same port.
 */
test('the default port is 5173, for the server and the device alike', () => {
  const plan = liveRunPlan(['--live']);
  assert.ok(typeof plan !== 'string');
  assert.equal(plan.port, 5173);
  assert.deepEqual(plan.devServer, ['npx', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort']);
  assert.deepEqual(plan.capRun('emulator-5554'), [
    'npx', 'cap', 'run', 'android', '--target', 'emulator-5554',
    '--live-reload', '--host', 'localhost', '--port', '5173', '--forwardPorts', '5173:5173',
  ]);
});

test('--port moves the server, the live URL and the forwarded port together', () => {
  const plan = liveRunPlan(['--live', '--port', '5200']);
  assert.ok(typeof plan !== 'string');
  assert.ok(plan.devServer.includes('5200'));
  assert.ok(plan.capRun('x').includes('5200:5200'));
});

// Found on the emulator: Vite on "localhost" bound only [::1] on Windows, and
// adb reverse, which connects to 127.0.0.1, got an empty response.
test('the server listens on the IPv4 loopback adb reverse reaches, never on the network', () => {
  const plan = liveRunPlan(['--live']);
  assert.ok(typeof plan !== 'string');
  assert.equal(plan.devServer[plan.devServer.indexOf('--host') + 1], '127.0.0.1');
});

test('a port that is not a number, missing, or out of range is a usage error', () => {
  for (const args of [['--port', 'abc'], ['--port'], ['--port', '80'], ['--port', '70000']]) {
    assert.equal(liveRunPlan(['--live', ...args]), '--port must be a number from 1024 to 65535.', args.join(' '));
  }
});

test('Capacitor runs gradlew by its bare name, so its environment drops NoDefaultCurrentDirectoryInExePath', () => {
  const plan = liveRunPlan(['--live']);
  assert.ok(typeof plan !== 'string');
  assert.deepEqual(plan.capRunEnv({ PATH: 'p', NoDefaultCurrentDirectoryInExePath: '1', JAVA_HOME: 'j' }), { PATH: 'p', JAVA_HOME: 'j' });
  assert.deepEqual(plan.capRunEnv({ PATH: 'p' }), { PATH: 'p' });
});
