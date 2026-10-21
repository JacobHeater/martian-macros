import { expect, it } from 'vitest';
import { CalendarDate } from '../../src/domain/CalendarDate';
import { InMemoryHealthProfile } from '../../src/fixtures/InMemoryHealthProfile';
import { HealthReadFailure } from '../../src/healthIngest/HealthReadFailure';
import type { MmHealthProfile } from '../../src/platform/MmHealthProfile';
import { NativeHealthProfile } from '../../src/platform/NativeHealthProfile';
import { NoHealthProfile } from '../../src/platform/NoHealthProfile';
import { healthProfileReaderContract } from '../contracts/healthProfileReaderContract';

/** MM-69: Apple Health's profile for onboarding, with the plugin stood in for. */
const native = (held: MmHealthProfile) => new NativeHealthProfile({ profile: () => Promise.resolve(held) });

healthProfileReaderContract('Apple Health profile (bridge stood in for)', async () =>
  native({ sex: 'female', birthYear: 1990, birthMonth: 4, birthDay: 12, heightM: 1.68 }),
);
healthProfileReaderContract('Apple Health profile, nothing held (bridge stood in for)', async () => native({}));
healthProfileReaderContract('In-memory Apple Health profile', async () =>
  new InMemoryHealthProfile({ profile: { sex: 'male', birthDate: CalendarDate.of(1985, 1, 31), heightCm: 180 } }),
);
healthProfileReaderContract('No health profile', async () => new NoHealthProfile());

it('reads female and male, sex as HealthKit names it, and nothing for other or not set', async () => {
  expect((await native({ sex: 'female' }).readProfile()).sex).toBe('female');
  expect((await native({ sex: 'male' }).readProfile()).sex).toBe('male');
  expect((await native({ sex: 'other' }).readProfile()).sex).toBeUndefined();
  expect((await native({}).readProfile()).sex).toBeUndefined();
});

it('reads the date of birth from its parts, and nothing from parts that make no day', async () => {
  expect((await native({ birthYear: 1990, birthMonth: 4, birthDay: 12 }).readProfile()).birthDate).toBe(
    CalendarDate.of(1990, 4, 12),
  );
  expect((await native({ birthYear: 1990, birthMonth: 2, birthDay: 30 }).readProfile()).birthDate).toBeUndefined();
  expect((await native({ birthYear: 1990, birthMonth: 4 }).readProfile()).birthDate).toBeUndefined();
});

it('reads the height in metres as centimetres, to a tenth', async () => {
  expect((await native({ heightM: 1.8034 }).readProfile()).heightCm).toBe(180.3);
  expect((await native({ heightM: 0 }).readProfile()).heightCm).toBeUndefined();
});

it('a failed read is a HealthReadFailure, never an empty profile', async () => {
  const failing = new NativeHealthProfile({ profile: () => Promise.reject(new Error('HealthKit failed')) });
  await expect(failing.readProfile()).rejects.toBeInstanceOf(HealthReadFailure);
});

it('only Apple Health offers a profile', () => {
  expect(native({}).offersProfile).toBe(true);
  expect(new NoHealthProfile().offersProfile).toBe(false);
});
