import type { CalendarDate } from '../../CalendarDate';
import type { UserSetup } from '../../UserSetup';

const values = [
  /** Pregnant or breastfeeding: the amounts differ (MM-310). */
  'careTeam',
  /** Chronic kidney disease: potassium and others may be set by a care team. */
  'kidney',
  /** After bariatric surgery: a surgical care team sets these (MM-310, the panel's MN-6). */
  'surgery',
  /** Under 19: the adult bands do not apply. */
  'young',
] as const;

/**
 * Why the Micros view shows no reference amounts for this person, if it
 * does not (MM-310). Amounts are still shown.
 */
export type ReferenceWithheld = (typeof values)[number];

export const ReferenceWithheld = {
  values,

  /** The reason for `setup` on `today`, or undefined when the references apply. */
  of(setup: UserSetup, today: CalendarDate): ReferenceWithheld | undefined {
    const s = setup.screening;
    if (s.pregnant || s.breastfeeding) return 'careTeam';
    if (s.chronicKidneyDisease) return 'kidney';
    if (s.bariatricSurgery) return 'surgery';
    if (setup.profile.ageOn(today) < 19) return 'young';
    return undefined;
  },
} as const;
