import type { PauseReason } from '../domain';

const labels: Readonly<Record<PauseReason, string>> = {
  travel: 'Travel',
  illness: 'Illness',
  injury: 'Injury',
  other: 'Other',
};

export const pauseReasonLabel = (reason: PauseReason): string => labels[reason];
