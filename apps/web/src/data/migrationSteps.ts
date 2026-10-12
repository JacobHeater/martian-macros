import type { MigrationStep } from './MigrationStep';

/**
 * One step per released version, keyed by the version it upgrades *from*.
 * Step `n` takes a database at version `n` to version `n + 1`. None yet:
 * version 1 is the first.
 */
export const migrationSteps: ReadonlyMap<number, MigrationStep> = new Map();
