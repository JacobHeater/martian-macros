import type { HealthDataType } from '../healthIngest/HealthDataType';

/** What the platform has and what the person allows: the part of the app's `HealthConnection` this reads. */
interface CardioSources {
  readonly available: ReadonlySet<HealthDataType>;
  readonly permitted: ReadonlySet<HealthDataType>;
}

/**
 * What brings cardio and steps to the app, said where they would show
 * until the wearable is in use (MM-677, the owner's rule of disclosure over
 * deferral): the platform by name, and the two kinds to allow. Undefined
 * while the platform has not been looked at.
 */
export function cardioDisclosureText(connection: CardioSources | undefined, platformName: string): string {
  if (connection === undefined || connection.available.size === 0) {
    return `Comes from a watch or phone through ${platformName}, which this phone does not have.`;
  }
  const missing = (['steps', 'workout'] as const).filter((type) => !connection.permitted.has(type));
  if (missing.length === 0) return `Nothing from your watch yet. Steps and sessions arrive through ${platformName} as it counts them.`;
  const kinds = missing.length === 2 ? 'Steps and Exercise sessions' : missing[0] === 'steps' ? 'Steps' : 'Exercise sessions';
  return `Comes from your watch through ${platformName}. Allow ${kinds} in Settings › Health to see it here.`;
}
