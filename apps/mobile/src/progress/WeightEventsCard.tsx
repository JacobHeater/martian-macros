import type { UserSetup } from '../domain/UserSetup';
import type { WeightEvent } from '../domain/WeightEvent';
import { WeightEventType } from '../domain/WeightEventType';
import { effectiveWeightEvents } from '../engine/effectiveWeightEvents';
import { weightEventLabel } from '../format/weightEventLabel';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import { WeightEventEntrySheet } from './WeightEventEntrySheet';

const same = (a: WeightEvent, b: WeightEvent) => a.date === b.date && a.type === b.type;

/** The creatine start given at onboarding, as an event, when it is not already a stored one. */
export function onboardingCreatine(stored: readonly WeightEvent[], setup: UserSetup | undefined): WeightEvent | undefined {
  const startedOn = setup?.creatineStartedOn;
  if (startedOn === undefined) return undefined;
  const event: WeightEvent = { date: startedOn, type: 'startedCreatine' };
  return stored.some((existing) => same(existing, event)) ? undefined : event;
}

/**
 * The things the user has noted that move the scale without being fat or
 * muscle: illness, travel, a training change, a big meal, creatine. Each
 * says what it does to the trend.
 */
export function WeightEventsCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const events = useCell(state.weightEvents);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);

  const remove = async (event: WeightEvent) => {
    try {
      await services.weightEvents.deleteWeightEvent(event);
    } catch {
      overlays.snack('Could not delete the weight event. Please try again.');
    }
  };

  const list = (stored: readonly WeightEvent[]) => {
    const fromOnboarding = onboardingCreatine(stored, setup);
    const all = [...stored, ...(fromOnboarding === undefined ? [] : [fromOnboarding])].sort((a, b) => {
      const byDate = a.date.compareTo(b.date);
      return byDate !== 0 ? byDate : WeightEventType.values.indexOf(a.type) - WeightEventType.values.indexOf(b.type);
    });
    if (all.length === 0) {
      return (
        <p className="app-text">
          Note illness, travel, training changes, meals, or creatine to help separate water changes from tissue
          change. If you start or stop creatine later, add an event here.
        </p>
      );
    }
    const effective = effectiveWeightEvents(stored);
    const effect = (event: WeightEvent) => {
      if (event.type === 'startedCreatine' || event.type === 'stoppedCreatine') {
        return 'Creatine shift estimated across 21 days.';
      }
      return effective.some((active) => same(active, event))
        ? 'Scale noise widened around this event.'
        : 'Recorded only; two other events in this 14-day window already affect the trend.';
    };
    return (
      <>
        <p className="app-text">If you start or stop creatine later, add an event here.</p>
        {[...all].reverse().map((event) => (
          <MmListRow
            key={`${event.date.epochDay}-${event.type}`}
            title={`${event.date.toString()} · ${weightEventLabel(event.type)}`}
            subtitle={effect(event)}
            trailing={event === fromOnboarding ? <span>Onboarding</span> : undefined}
            trailingAction={
              event === fromOnboarding ? undefined : (
                <MmIconButton
                  icon="delete"
                  label={`Delete ${weightEventLabel(event.type).toLowerCase()} event`}
                  onPress={() => void remove(event)}
                />
              )
            }
          />
        ))}
      </>
    );
  };

  return (
    <InfoCard
      title="Weight events"
      trailing={
        <MmButton
          label="Add"
          kind="secondary"
          icon="plus"
          onPress={() =>
            void overlays.sheet<void>('Add a weight event', (close) => (
              <WeightEventEntrySheet today={today} onDone={() => close()} />
            ))
          }
        />
      }
    >
      {events.ready ? (
        list(events.value)
      ) : Loadable.hasFailed(events) ? (
        <p className="app-text">Could not load weight events.</p>
      ) : (
        <p className="app-text">Loading weight events...</p>
      )}
    </InfoCard>
  );
}
