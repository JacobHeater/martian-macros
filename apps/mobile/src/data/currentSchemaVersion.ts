/**
 * The user's database (MM-231). Version 1 of the TypeScript app is the
 * shape the Dart app's database had reached at its version 31: the app was
 * never released, so there is nothing installed to migrate and the 31 steps
 * that led here are not carried over. A test compares every column with
 * what the Dart database declared.
 *
 * Bump `currentSchemaVersion` with every change to a table, change
 * `currentSchema` to the new shape (a new install is created from it), and
 * add the step that takes an existing database there to `migrationSteps`.
 */
export const currentSchemaVersion = 6;
