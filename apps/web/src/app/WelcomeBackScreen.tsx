import { Fmt } from '../format/Fmt';
import { Loadable } from '../state/Loadable';
import { MmButton } from '../ui/MmButton';
import { NumberEntryCard } from '../ui/NumberEntryCard';
import { Screen } from './Screen';
import { useApp } from './useApp';
import { useCell } from './useCell';

/**
 * The one screen shown on the first opening after a gap (MM-147). It asks
 * for the single thing the coach needs, a weigh-in, and says nothing about
 * the days away: no count, no summary, no streak.
 *
 * The end of a pause shows the same screen (`resuming`) without a word that
 * implies absence (MM-148).
 */
export function WelcomeBackScreen({ resuming = false }: { resuming?: boolean }) {
  const { services, state } = useApp();
  const setup = Loadable.valueOf(useCell(state.setup));
  const today = useCell(state.today);
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  return (
    <Screen roomy>
      <div className="app-gap-large" />
      <h1 className="app-headline">{resuming ? 'Ready to resume?' : 'Welcome back'}</h1>
      <p className="app-lead">
        {resuming
          ? 'A weigh-in gets the coach going again. Your targets are ' +
            'what they were, and the next check-in is in a week. ' +
            'Expect the scale to move for a few days while water ' +
            'settles; that is not fat.'
          : 'To pick up, the coach needs one thing: a weigh-in.'}
      </p>
      <div className="app-gap" />
      <NumberEntryCard
        title="Today’s weigh-in"
        unit={fmt.weightUnit}
        initial={undefined}
        hint="First thing in the morning, after the bathroom."
        onSave={(value) => services.weights.saveWeight(today, fmt.weightToKg(value))}
      />
      <MmButton label="Later" kind="text" onPress={() => void services.preferences.saveReturnScreenDismissedOn(today)} />
    </Screen>
  );
}
