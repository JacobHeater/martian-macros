import { expect, it } from 'vitest';
import { AppIdentity } from '../../src/app/AppIdentity';
import { databaseNameFor } from '../../src/app/databaseNameFor';

/**
 * MM-8, MM-177: three identities, each its own app on the phone. The demo
 * keeps its own database name so a seed can never open another app's
 * database; the real app and its dev twin are different sandboxes, so one
 * name serves both. A build define that names nothing known is the dev one.
 */
it('names the database for the identity, the demo apart', () => {
  expect(databaseNameFor('prod')).toBe('martian_macros');
  expect(databaseNameFor('dev')).toBe('martian_macros');
  expect(databaseNameFor('demo')).toBe('martian_macros_demo');
});

it('reads the identity a build was given, and takes anything else for dev', () => {
  expect(AppIdentity.values).toEqual(['prod', 'dev', 'demo']);
  expect(AppIdentity.of('prod')).toBe('prod');
  expect(AppIdentity.of('demo')).toBe('demo');
  expect(AppIdentity.of('')).toBe('dev');
  expect(AppIdentity.of('staging')).toBe('dev');
});
