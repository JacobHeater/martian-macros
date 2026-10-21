import { expect, it } from 'vitest';
import { InMemoryHealthWriting } from '../../src/fixtures/InMemoryHealthWriting';
import { NativeHealthWriting } from '../../src/platform/NativeHealthWriting';
import { NoHealthWriting } from '../../src/platform/NoHealthWriting';
import { healthIntakeWriterContract } from '../contracts/healthIntakeWriterContract';
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
