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
  7: 'b5f5c969f0c69723ef9e9852f9f5ffd12d94b8edd3f61120a4c032d4c001108a',
  8: '4a0569a2ece9857339f453896f9d7e8b93d1de669281ea90a03ec705d6d04afe',
  9: '3e6e67178bea1ea3b8da22a6c8a6d9f1870a7a534463367561eba1376aa6e8f7',
  // MM-63: the day the last backup was made.
  10: 'c6a2ec1fff0b8639470370e149a37fbda26d6649c1aeefb4ba7b1c7c019064ff',
  11: '20dea0d256c34b6fbd7abe7c05195385d75ef4e7a32f75802db4bb93d87d8b3d',
};

it('the schema is the one recorded for its version', () => {
  const fingerprint = createHash('sha256').update(currentSchema).digest('hex');
  expect(fingerprints[currentSchemaVersion], `Version ${currentSchemaVersion} has no recorded schema: add one`).toBeDefined();
  expect(fingerprint, 'The schema changed without a new version: bump currentSchemaVersion and add a step').toBe(
    fingerprints[currentSchemaVersion],
  );
});
