import type { UserSetup } from '../domain/UserSetup';
import type { WeightEvent } from '../domain/WeightEvent';

const same = (a: WeightEvent, b: WeightEvent) => a.date === b.date && a.type === b.type;

/** The creatine start given at onboarding, as an event, when it is not already a stored one. */
export function onboardingCreatine(stored: readonly WeightEvent[], setup: UserSetup | undefined): WeightEvent | undefined {
  const startedOn = setup?.creatineStartedOn;
  if (startedOn === undefined) return undefined;
  const event: WeightEvent = { date: startedOn, type: 'startedCreatine' };
  return stored.some((existing) => same(existing, event)) ? undefined : event;
}
