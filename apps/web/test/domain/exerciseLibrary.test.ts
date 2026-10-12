import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { builtInExercises, Equipment, type Exercise, HealthConnectSegment, MuscleGroup } from '../../src/domain';

/**
 * MM-76 and MM-189: the built-in exercise library and how it lines up with
 * what Health Connect can name.
 */
function named(name: string): Exercise {
  const found = builtInExercises.filter((e) => e.name === name);
  expect(found, name).toHaveLength(1);
  return found[0] as Exercise;
}

describe('the library', () => {
  it('has about 150 exercises', () => {
    expect(builtInExercises.length).toBeGreaterThanOrEqual(140);
    expect(builtInExercises.length).toBeLessThanOrEqual(170);
  });

  it('has no two exercises with the same id or name', () => {
    const ids = new Set(builtInExercises.map((e) => e.id));
    const names = new Set(builtInExercises.map((e) => e.name.toLowerCase()));
    expect(ids.size).toBe(builtInExercises.length);
    expect(names.size).toBe(builtInExercises.length);
  });

  it('gives every exercise an id that is safe to store', () => {
    for (const e of builtInExercises) {
      expect(e.id, e.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('never lists the primary muscle group as a secondary one', () => {
    for (const e of builtInExercises) {
      expect(e.secondary, e.name).not.toContain(e.primary);
      expect(new Set(e.secondary).size).toBe(e.secondary.length);
    }
  });

  it('has several exercises for every muscle group', () => {
    for (const group of MuscleGroup.values) {
      const count = builtInExercises.filter((e) => e.primary === group).length;
      expect(count, group).toBeGreaterThanOrEqual(4);
    }
  });

  it('has every kind of equipment', () => {
    expect(new Set(builtInExercises.map((e) => e.equipment))).toEqual(new Set(Equipment.values));
  });

  it('records bodyweight exercises as loaded by bodyweight', () => {
    expect(named('Pull-up').load).toBe('bodyweight');
    expect(named('Push-up').load).toBe('bodyweight');
    expect(named('Barbell bench press').load).toBe('addedWeight');
  });

  it('says what the bench press trains (MM-78)', () => {
    const bench = named('Barbell bench press');
    expect(bench.primary).toBe('chest');
    expect(bench.secondary).toEqual(['shoulders', 'triceps']);
  });
});

describe('lining up with Health Connect', () => {
  it('a movement the platform names carries its type', () => {
    expect(named('Barbell bench press').healthConnect).toBe('benchPress');
    expect(named('Back squat').healthConnect).toBe('squat');
    expect(named('Deadlift').healthConnect).toBe('deadlift');
    expect(named('Pull-up').healthConnect).toBe('pullUp');
  });

  it("a variant carries its movement's type", () => {
    expect(named('Incline dumbbell bench press').healthConnect).toBe('benchPress');
    expect(named('Chin-up').healthConnect).toBe('pullUp');
  });

  it('a movement it does not name has none, and is never the nearest', () => {
    // The fallback list of MM-188.
    for (const name of [
      'Push-up',
      'Dip',
      'Barbell row',
      'Seated cable row',
      'T-bar row',
      'Dumbbell fly',
      'Pec deck',
      'Cable crossover',
      'Face pull',
      'Dumbbell reverse fly',
      'Barbell shrug',
      'Dumbbell pullover',
      'Triceps pushdown',
      'Skull crusher',
      'Standing calf raise',
      'Glute bridge',
      'Good morning',
      'Hip abduction',
      'Split squat',
      'Bulgarian split squat',
      'Step-up',
      'Hack squat',
      "Farmer's carry",
      'Ab wheel rollout',
      'Russian twist',
      'Pallof press',
      'Wrist curl',
    ]) {
      expect(named(name).healthConnect, name).toBeUndefined();
    }
  });

  it('the types that record a side, or duplicate another, are not used', () => {
    // MM-188: the log does not record a side, and the library uses the
    // two-arm dumbbell triceps extension, not its duplicate.
    const unused = new Set<HealthConnectSegment>([
      'dumbbellCurlLeftArm',
      'dumbbellCurlRightArm',
      'dumbbellTricepsExtensionLeftArm',
      'dumbbellTricepsExtensionRightArm',
      'doubleArmTricepsExtension',
      'forwardTwist',
      'hulaHoop',
      'punch',
      'upperTwist',
    ]);
    const used = new Set<HealthConnectSegment>();
    for (const e of builtInExercises) {
      if (e.healthConnect !== undefined) used.add(e.healthConnect);
    }
    expect([...used].filter((segment) => unused.has(segment))).toEqual([]);
    expect(used).toEqual(new Set(HealthConnectSegment.values.filter((segment) => !unused.has(segment))));
  });

  it('every identifier is the one checked in MM-188', () => {
    // The ticket's table was checked by script against the client
    // library's source. This keeps the code from drifting from it.
    const ticket = readFileSync(
      '../../requirements/health-sync/SPIKE.what-exercises-the-platforms-can-name.MM-188.md',
      'utf8',
    );
    const checked = new Map<string, number>();
    for (const found of ticket.matchAll(/^\| `([A-Z_]+)` \| (\d+) \|/gm)) {
      checked.set(found[1] as string, Number(found[2]));
    }
    expect(checked.size).toBe(42);
    expect(
      new Map(
        HealthConnectSegment.values.map((s) => [HealthConnectSegment.platformName(s), HealthConnectSegment.platformId(s)]),
      ),
    ).toEqual(checked);
  });
});
