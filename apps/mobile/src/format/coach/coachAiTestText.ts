import type { CoachAiProvider } from '../../domain/integration/CoachAiProvider';
import type { CoachNarrationOutcome } from '../../domain/integration/CoachNarrationOutcome';
import { coachAiProviderName } from '../coachAiProviderName';

/**
 * What Settings' "Test AI coach" says of what came back (MM-671): the model's
 * own words on the person's numbers, or the one reason there are none and
 * what shows in their place. `trouble` marks a reason.
 */
export function coachAiTestText(
  outcome: CoachNarrationOutcome,
  provider: CoachAiProvider,
): { readonly trouble: boolean; readonly title: string; readonly text: string } {
  const name = coachAiProviderName(provider);
  switch (outcome.kind) {
    case 'off':
      return { trouble: true, title: 'Nothing to test yet', text: 'Choose a provider and paste its API key first.' };
    case 'narrated':
      return { trouble: false, title: `${name}, on your numbers`, text: outcome.text };
    case 'unreachable':
      return {
        trouble: true,
        title: `${name} could not be reached`,
        text: `${outcome.detail === '' ? 'No answer came back.' : outcome.detail} Check the connection and try again.`,
      };
    case 'refused':
      return {
        trouble: true,
        title: `${name} refused the request (HTTP ${outcome.status})`,
        text: outcome.detail === '' ? 'It gave no reason. Check the key.' : outcome.detail,
      };
    case 'empty':
      return {
        trouble: true,
        title: `${name} answered with no words`,
        text: 'The built-in coach speaks until it does. Try again.',
      };
    case 'rejected':
      return {
        trouble: true,
        title: `${name}’s words failed the check`,
        text: `${outcome.reason}, so the built-in coach speaks instead. It wrote: “${outcome.text}”`,
      };
  }
}
