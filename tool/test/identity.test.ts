import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apkPathOf, appIdOf, displayNameOf, gradleTaskOf, identityOf, iosSuffixOf } from '../src/identity.ts';

/** MM-8: three identities, one id on both platforms, chosen by `--env`. */
test('the identity follows --env, and nothing or phone is the dev twin', () => {
  assert.equal(identityOf([]), 'dev');
  assert.equal(identityOf(['--env', 'dev']), 'dev');
  assert.equal(identityOf(['--env', 'prod', '-d', 'x']), 'prod');
  assert.equal(identityOf(['--env', 'demo']), 'demo');
  assert.equal(identityOf(['--env', 'phone']), 'dev');
  assert.match(identityOf(['--env', 'staging']) as string, /must be one of/);
  assert.match(identityOf(['--env']) as string, /needs a value/);
  // `--prod` is the short way to the real app, on either platform (the owner, 2026-10-19).
  assert.equal(identityOf(['--prod']), 'prod');
  assert.equal(identityOf(['--ios', '--phone', '--prod']), 'prod');
  assert.equal(identityOf(['--prod', '--env', 'prod']), 'prod');
  assert.match(identityOf(['--prod', '--env', 'demo']) as string, /disagree/);
  assert.match(identityOf(['--env', '--release']) as string, /needs a value/);
});

test('each identity has its own id and name, the same on Android and iOS', () => {
  assert.deepEqual(
    (['prod', 'dev', 'demo'] as const).map((identity) => [appIdOf(identity), displayNameOf(identity), iosSuffixOf(identity)]),
    [
      ['com.martianmacros', 'Martian Macros', ''],
      ['com.martianmacros.dev', 'Martian Macros Dev', '.dev'],
      ['com.martianmacros.demo', 'Martian Macros DEMO', '.demo'],
    ],
  );
});

test('the Gradle task and the APK follow the flavor and the build type', () => {
  assert.equal(gradleTaskOf('dev', { release: false }), 'assembleDevDebug');
  assert.equal(gradleTaskOf('prod', { release: true }), 'assembleProdRelease');
  assert.equal(apkPathOf('demo', { release: false }), 'app/build/outputs/apk/demo/debug/app-demo-debug.apk');
  assert.equal(apkPathOf('prod', { release: true }), 'app/build/outputs/apk/prod/release/app-prod-release-unsigned.apk');
});
