import type { TargetFlag } from './TargetFlag';

const values = ['requestedBreak', 'requestedOneWeekBreak', 'dietBreak'] as const satisfies readonly TargetFlag[];

/**
 * The flag a diet break's targets carry (MM-135): planned by the app at the
 * cap, or chosen by the person, for two weeks or one (MM-432). The flag is
 * how a break's records carry its length.
 */
export type BreakFlag = (typeof values)[number];

export const BreakFlag = { values } as const;
