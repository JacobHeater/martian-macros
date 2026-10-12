import { expect, it } from 'vitest';
import { StateError } from '../../src/lang/StateError';
import { DemoConfiguration } from '../../src/state/DemoConfiguration';

/** The demo app never touches the ordinary database. Carried over from demo_configuration_test.dart. */
it('normal dev and prod configurations never select demo storage', () => {
  for (const environment of ['dev', 'prod']) {
    for (const isAndroid of [false, true]) {
      const config = new DemoConfiguration({ demoApp: false, isAndroid, environment, seed: false });
      expect(config.isDemo).toBe(false);
      expect(config.databaseName).toBe('martian_macros');
      expect(config.seed).toBe(false);
    }
  }
});

it('demo storage is distinct and guarded by Android identity and the dev environment', () => {
  const config = new DemoConfiguration({ demoApp: true, isAndroid: true, environment: 'dev', seed: true });
  expect(config.databaseName).toBe('martian_macros_demo');
  for (const [demoApp, isAndroid, environment, seed] of [
    [false, true, 'dev', true],
    [false, true, 'prod', true],
    [true, true, 'prod', true],
    [true, true, 'prod', false],
    [true, false, 'dev', true],
  ] as const) {
    expect(() => new DemoConfiguration({ demoApp, isAndroid, environment, seed })).toThrow(StateError);
  }
});
