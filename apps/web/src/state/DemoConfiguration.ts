import { StateError } from '../lang/StateError';

/**
 * Whether this build is the demo app, and whether it seeds itself. The
 * Android build derives its separate app ID from this same demo flag. A
 * seed flag alone must never select or erase the ordinary database.
 */
export class DemoConfiguration {
  readonly isDemo: boolean;
  readonly seed: boolean;

  constructor({
    demoApp,
    isAndroid,
    environment,
    seed,
  }: {
    demoApp: boolean;
    isAndroid: boolean;
    environment: string;
    seed: boolean;
  }) {
    this.isDemo = demoApp;
    this.seed = seed;
    if ((this.isDemo && (!isAndroid || environment !== 'dev')) || (seed && !this.isDemo)) {
      throw new StateError('Demo seeding requires Android demo identity and dev config.');
    }
  }

  get databaseName(): string {
    return this.isDemo ? 'martian_macros_demo' : 'martian_macros';
  }
}
