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
  // MM-58: the online lookup choice and the foods found online.
  12: 'b8898dd0ad77f654de3c3184350e8db5680fe5063ba2b34e052d19a7e35feec3',
  // MM-250, MM-251: the nights of sleep and the sleep-disorder answer.
  13: '8c338155e56e604938a2dea2c4af79515f5991f2ddc5ea2e3f7bda1b7232fce2',
  // MM-167, MM-151, MM-152: the state a food was logged in, the conversion to grams, the usual cooking fat.
  14: '6ea4e17738f9d1c856ead90d9c7486da11d53a22bc7f40ccf73672afe1e6f420',
  // MM-71: the scale chosen as primary in Settings.
  15: 'eef87657d12062f15e42cbc2abd1ece171456c8d17e7a33912cabc3248bf03ef',
  // MM-486: how the user shapes their targets (MM-122, MM-124).
  16: 'a76d6b199d6dcbaa83ea2e277b425d2c9979355927cfb92435936af5827a3b16',
};

it('the schema is the one recorded for its version', () => {
  const fingerprint = createHash('sha256').update(currentSchema).digest('hex');
  expect(fingerprints[currentSchemaVersion], `Version ${currentSchemaVersion} has no recorded schema: add one`).toBeDefined();
  expect(fingerprint, 'The schema changed without a new version: bump currentSchemaVersion and add a step').toBe(
    fingerprints[currentSchemaVersion],
  );
});
