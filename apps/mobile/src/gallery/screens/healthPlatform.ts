import { HealthDataType } from '../../healthIngest/HealthDataType';
import type { HealthWriteKind } from '../../healthIngest/HealthWriteKind';
import { FakeHealthSource } from '../../healthIngest/testing/FakeHealthSource';
import { InMemoryHealthWriting } from '../../fixtures/InMemoryHealthWriting';
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
 * platform names by a package id and no app name (MM-395). `secondScale`
 * adds evening weigh-ins from a gym's scale on two of the days (MM-71).
 * `writing` are the kinds the app writes to it, turned on already (MM-70).
 * `historyRefused` keeps the app to the thirty days before the story's
 * week (MM-73), the history permission refused. `stopsAsking` are kinds
 * the platform no longer shows the request for, and `opensPermissions`
 * whether its screen of the app's permissions opens (MM-323).
 */
export function healthPlatform({
  allowed = [],
  refuses = [],
  unreadable = false,
  empty = [],
  stepsUnnamed = false,
  secondScale = false,
  writing = [],
  historyRefused = false,
  stopsAsking = [],
  opensPermissions = true,
}: {
  allowed?: readonly HealthDataType[];
  refuses?: readonly HealthDataType[];
  unreadable?: boolean;
  empty?: readonly HealthDataType[];
  stepsUnnamed?: boolean;
  secondScale?: boolean;
  writing?: readonly HealthWriteKind[];
  historyRefused?: boolean;
  stopsAsking?: readonly HealthDataType[];
  opensPermissions?: boolean;
} = {}): StoryDevice {
  const values: Record<HealthDataType, number> = {
    weight: 82.4,
    bodyFat: 21.5,
    leanMass: 64.7,
    height: 180,
    workout: 50,
    menstruation: 1,
    steps: 8400,
    sleep: 412,
  };
  // A night of sleep spans the evening before to the morning it is kept against.
  const evening = (daysBefore: number) => `${storyToday.addDays(-daysBefore - 1).toString()}T23:10:00`;
  const events = [1, 2, 3].flatMap((day) =>
    HealthDataType.values.map((type) => ({
      op: 'add',
      type,
      id: `${type}-${day}`,
      value: values[type],
      start: type === 'sleep' ? evening(day) : morning(day),
      ...(type === 'sleep' ? { end: morning(day) } : {}),
      source:
        type === 'steps' && stepsUnnamed
          ? 'com.android.healthconnect.phone.j07164f9d1f553234a69c64d'
          : type === 'steps' || type === 'workout' || type === 'sleep'
            ? 'watch'
            : 'scale',
    })),
  );
  const gym = (secondScale ? [1, 2] : []).map((day) => ({
    op: 'add',
    type: 'weight' as const,
    id: `weight-gym-${day}`,
    value: 83.1,
    start: `${storyToday.addDays(-day).toString()}T18:30:00`,
    source: 'gym',
  }));
  const kept = [...events, ...gym].filter((event) => !empty.includes(event.type));
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
          { id: 'gym', name: 'Gym scale' },
        ],
        events: [...kept, ...emptied],
      }),
    );
    await source.permit(new Set(allowed));
    source.willPermit = new Set(HealthDataType.values.filter((type) => !refuses.includes(type)));
    source.unreadable = unreadable;
    source.stopsAsking = new Set(stopsAsking);
    source.opensPermissions = opensPermissions;
    if (historyRefused) {
      source.historyFrom = new Date(`${storyToday.addDays(-30).toString()}T00:00:00`);
      source.willPermitHistory = false;
      // Asked once already, and refused.
      await source.requestHistory();
    }
    return { ...services, healthSource: source, healthWriting: new InMemoryHealthWriting({ on: writing }) };
  };
}
