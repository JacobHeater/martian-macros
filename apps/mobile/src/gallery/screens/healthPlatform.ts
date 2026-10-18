import { HealthDataType } from '../../healthIngest/HealthDataType';
import { FakeHealthSource } from '../../healthIngest/testing/FakeHealthSource';
import type { StoryDevice } from './StoryDevice';
import { storyToday } from './storyToday';

/** A morning in the week before the story's day, as a platform writes it. */
const morning = (daysBefore: number) => `${storyToday.addDays(-daysBefore).toString()}T07:05:00`;

/**
 * A phone with Health Connect on it and a week of made-up readings of every
 * kind the app reads (MM-320): `allowed` are permitted, the rest are offered.
 * `refuses` are turned down when asked; `unreadable` fails every read;
 * `empty` are on the platform with nothing in them (a reading added and deleted).
 * `stepsUnnamed` has the steps counted by the phone itself, which the
 * platform names by a package id and no app name (MM-395).
 */
export function healthPlatform({
  allowed = [],
  refuses = [],
  unreadable = false,
  empty = [],
  stepsUnnamed = false,
}: {
  allowed?: readonly HealthDataType[];
  refuses?: readonly HealthDataType[];
  unreadable?: boolean;
  empty?: readonly HealthDataType[];
  stepsUnnamed?: boolean;
} = {}): StoryDevice {
  const values: Record<HealthDataType, number> = {
    weight: 82.4,
    bodyFat: 21.5,
    leanMass: 64.7,
    height: 180,
    workout: 50,
    menstruation: 1,
    steps: 8400,
  };
  const events = [1, 2, 3].flatMap((day) =>
    HealthDataType.values.map((type) => ({
      op: 'add',
      type,
      id: `${type}-${day}`,
      value: values[type],
      start: morning(day),
      source:
        type === 'steps' && stepsUnnamed
          ? 'com.android.healthconnect.phone.j07164f9d1f553234a69c64d'
          : type === 'steps' || type === 'workout'
            ? 'watch'
            : 'scale',
    })),
  );
  const kept = events.filter((event) => !empty.includes(event.type));
  const emptied = empty.flatMap((type) => [
    { op: 'add', type, id: `${type}-gone`, value: values[type], start: morning(1), source: 'scale' },
    { op: 'delete', type, id: `${type}-gone` },
  ]);
  return async (services) => {
    const source = FakeHealthSource.fromJson(
      JSON.stringify({
        sources: [
          { id: 'scale', name: 'Bathroom scale' },
          { id: 'watch', name: 'Watch' },
        ],
        events: [...kept, ...emptied],
      }),
    );
    await source.permit(new Set(allowed));
    source.willPermit = new Set(HealthDataType.values.filter((type) => !refuses.includes(type)));
    source.unreadable = unreadable;
    return { ...services, healthSource: source };
  };
}
