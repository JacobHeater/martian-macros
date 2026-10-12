import type { SqlDatabase } from '../sql/SqlDatabase';

/** Takes a database from one schema version to the next, inside the upgrade's transaction. */
export type MigrationStep = (db: SqlDatabase) => Promise<void>;
