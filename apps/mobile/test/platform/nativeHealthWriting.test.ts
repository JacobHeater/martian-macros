import { expect, it } from 'vitest';
import { InMemoryHealthWriting } from '../../src/fixtures/InMemoryHealthWriting';
import { NativeHealthWriting } from '../../src/platform/NativeHealthWriting';
import { NoHealthWriting } from '../../src/platform/NoHealthWriting';
import { healthIntakeWriterContract } from '../contracts/healthIntakeWriterContract';
import { healthWeightWriterContract } from '../contracts/healthWeightWriterContract';
import { healthWriteNamespaceContract } from '../contracts/healthWriteNamespaceContract';
import { healthWritingContract } from '../contracts/healthWritingContract';
import { fakeMmHealthWrites } from '../support/fakeMmHealthWrites';

// MM-70, MM-314: the adapter the phone uses with the plugin stood in for, the fixture, and where there is no platform.
healthWritingContract('Health Connect (bridge stood in for)', async () => new NativeHealthWriting(fakeMmHealthWrites().api));
healthWritingContract(
  'Health Connect, every write refused',
  async () => new NativeHealthWriting(fakeMmHealthWrites({ grants: [] }).api),
);
healthWritingContract('in memory', async () => new InMemoryHealthWriting());
healthWritingContract('in memory, water refused', async () => new InMemoryHealthWriting({ willPermit: ['food', 'workouts'] }));
healthWritingContract('no health platform', async () => new NoHealthWriting());

healthIntakeWriterContract('Health Connect (bridge stood in for)', async () => new NativeHealthWriting(fakeMmHealthWrites().api));
healthIntakeWriterContract(
  'Health Connect, every write refused',
  async () => new NativeHealthWriting(fakeMmHealthWrites({ grants: [] }).api),
);
healthIntakeWriterContract('in memory', async () => new InMemoryHealthWriting());
healthIntakeWriterContract('no health platform', async () => new NoHealthWriting());

// MM-513: a weigh-in typed in the app, through the plugin, in memory and where there is no platform.
healthWeightWriterContract('Health Connect (bridge stood in for)', async () => new NativeHealthWriting(fakeMmHealthWrites().api));
healthWeightWriterContract(
  'Health Connect, every write refused',
  async () => new NativeHealthWriting(fakeMmHealthWrites({ grants: [] }).api),
);
healthWeightWriterContract('in memory', async () => new InMemoryHealthWriting());
healthWeightWriterContract('no health platform', async () => new NoHealthWriting());

// MM-522: the namespace every written id carries, through the plugin, in memory and where there is no platform.
healthWriteNamespaceContract('Health Connect (bridge stood in for)', async () => new NativeHealthWriting(fakeMmHealthWrites().api));
healthWriteNamespaceContract('in memory', async () => new InMemoryHealthWriting());
healthWriteNamespaceContract('no health platform', async () => new NoHealthWriting());

it('without a namespace from the plugin, nothing is written (MM-522)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting({ ...fake.api, writeNamespace: async () => ({ namespace: '' }) });
  await expect(writing.writeNamespace()).rejects.toThrow();
});

const lunch = {
  id: 'martian-macros-food-1',
  start: new Date(2026, 9, 5, 12, 30),
  end: new Date(2026, 9, 5, 13, 0),
  kcal: 510,
  proteinG: 40,
  carbsG: 50,
  fatG: 15,
};

it('each kind is asked for by itself, the first time it is turned on (MM-70)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting(fake.api);
  await writing.startWriting('food');
  expect(fake.asked()).toEqual(['food']);
  await writing.startWriting('water');
  expect(fake.asked()).toEqual(['food', 'water']);
});

it('a nutrient the entry does not state is not sent, and one it does is (MM-70)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting(fake.api);
  await writing.startWriting('food');
  await writing.writeNutrition({ ...lunch, fiberG: 6, meal: 'lunch' });
  const sent = fake.nutrition.get(lunch.id)!;
  expect(sent).toMatchObject({ kcal: 510, fiberG: 6, meal: 'lunch', startMs: lunch.start.getTime() });
  expect('sodiumMg' in sent).toBe(false);
  expect('sugarsG' in sent).toBe(false);
});

it('An edit is mirrored: written again under its id, the platform holds 450 and not 960 (MM-70)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting(fake.api);
  await writing.startWriting('food');
  await writing.writeNutrition(lunch);
  await writing.writeNutrition({ ...lunch, kcal: 450 });
  expect([...fake.nutrition.values()].map((record) => record.kcal)).toEqual([450]);
});

it('a write the platform refuses is false, never an error (MM-70)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting({
    ...fake.api,
    writeNutrition: () => Promise.reject(new Error('The platform is busy.')),
    writeWater: () => Promise.reject(new Error('The platform is busy.')),
  });
  await writing.startWriting('food');
  await writing.startWriting('water');
  expect(await writing.writeNutrition(lunch)).toBe(false);
  expect(await writing.writeWater({ id: 'martian-macros-water-1', at: lunch.start, ml: 250 })).toBe(false);
});

it('a plugin that cannot answer leaves everything off (MM-70)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting({ ...fake.api, writing: () => Promise.reject(new Error('Not here.')) });
  expect(await writing.writing()).toEqual(new Set());
  expect(await writing.startWriting('food')).toBe(false);
  expect(await writing.writeNutrition(lunch)).toBe(false);
});

it('A typed weight appears: 82.4 kg at the time given, under the app’s id (MM-513)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting(fake.api);
  await writing.startWriting('weight');
  const at = new Date(2026, 9, 5, 7, 10);
  expect(await writing.writeWeight({ id: 'martian-macros-weight-a1b2c3-2026-10-05', at, kg: 82.4 })).toBe(true);
  expect(fake.weight.get('martian-macros-weight-a1b2c3-2026-10-05')).toEqual({
    id: 'martian-macros-weight-a1b2c3-2026-10-05',
    atMs: at.getTime(),
    kg: 82.4,
  });
  expect(fake.asked()).toEqual(['weight']);
});

it('Removed: turned off, the app’s food under every namespace is gone, and water and another app’s are not touched (MM-514)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting(fake.api);
  await writing.startWriting('food');
  await writing.startWriting('water');
  await writing.writeNutrition({ ...lunch, id: 'martian-macros-food-a1b2c3-1' });
  await writing.writeNutrition({ ...lunch, id: 'martian-macros-food-renewed1-1' });
  await writing.writeWater({ id: 'martian-macros-water-a1b2c3-1', at: lunch.start, ml: 250 });
  // What another app wrote is held by the platform under its own ids.
  fake.nutrition.set('another-app-7', { id: 'another-app-7', startMs: 0, endMs: 1, kcal: 300, proteinG: 1, carbsG: 1, fatG: 1 });
  await writing.stopWriting('food');
  expect(await writing.removeWritten('food')).toBe(true);
  expect([...fake.nutrition.keys()]).toEqual(['another-app-7']);
  expect([...fake.water.keys()]).toEqual(['martian-macros-water-a1b2c3-1']);
  expect(await writing.writing()).toEqual(new Set(['water']));
});

it('Kept: turned off without removing, what was written stays and nothing more is written (MM-514)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting(fake.api);
  await writing.startWriting('food');
  await writing.writeNutrition(lunch);
  await writing.stopWriting('food');
  expect(await writing.writeNutrition({ ...lunch, id: 'martian-macros-food-2' })).toBe(false);
  expect([...fake.nutrition.keys()]).toEqual([lunch.id]);
});

it('a removal the plugin cannot make is false, never an error (MM-514)', async () => {
  const fake = fakeMmHealthWrites();
  const writing = new NativeHealthWriting({ ...fake.api, removeWritten: () => Promise.reject(new Error('Not here.')) });
  await writing.startWriting('food');
  expect(await writing.removeWritten('food')).toBe(false);
});
