import { recalculationWeighInDays } from '../engine/coachConstants';
import type { RecalculationWithheldReason } from '../engine/RecalculationWithheldReason';

/** What keeps "Check in now" off, and what turns it on where something does (MM-559). */
export function recalculationWithheldText(reason: RecalculationWithheldReason): string {
  switch (reason) {
    case 'paused':
      return 'Targets are on hold during your pause.';
    case 'onBreak':
      return 'Your break holds targets at maintenance until it ends.';
    case 'easingIn':
      return 'You are easing out of your deficit in two steps. The second comes at the next check-in.';
    case 'noRecentWeighIn':
      return (
        `A check-in works from your current weight, and your last weigh-in is more than ` +
        `${recalculationWeighInDays} days old. Weigh in to turn it on.`
      );
    case 'issuedToday':
      return 'Your targets already changed today. You can check in again tomorrow.';
  }
}
