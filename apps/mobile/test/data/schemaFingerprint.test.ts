import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { currentSchema } from '../../src/data/currentSchema';
import { currentSchemaVersion } from '../../src/data/currentSchemaVersion';

/**
 * MM-325: a version's shape, once a build of it has been installed anywhere,
 * never changes. Version 4 did (a column added to its step after a build had
 * run on the owner's phone), and the sodium limit stopped switching on there.
 * Each version's schema is recorded here when it is made. Changing the schema
 * means a new version, a new step and a new line; never edit a line.
 */
const fingerprints: Readonly<Record<number, string>> = {
  5: '21a162134c2cfebc55a419ba9ba76c026a8cbb859774360ca34061519af6aea7',
  6: '1f7604f8e1f531f6bc74a1cd6e0564d30b65d679cf8bd39fc1783ff079626d5c',
};

it('the schema is the one recorded for its version', () => {
  const fingerprint = createHash('sha256').update(currentSchema).digest('hex');
  expect(fingerprints[currentSchemaVersion], `Version ${currentSchemaVersion} has no recorded schema: add one`).toBeDefined();
  expect(fingerprint, 'The schema changed without a new version: bump currentSchemaVersion and add a step').toBe(
    fingerprints[currentSchemaVersion],
  );
});
