import type { TargetFlag } from './TargetFlag';

const values = ['dietBreak', 'requestedBreak'] as const satisfies readonly TargetFlag[];

/** The flag a diet break's targets carry (MM-135): planned by the app at the cap, or chosen by the person. */
export type BreakFlag = (typeof values)[number];

export const BreakFlag = { values } as const;
