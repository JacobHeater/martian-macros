import type { WeightEvent } from '../domain/WeightEvent';
import { WeightEventType } from '../domain/WeightEventType';
import { effectiveWeightEvents } from '../engine/effectiveWeightEvents';
import { Fmt } from '../format/Fmt';
import { weightEventLabel } from '../format/weightEventLabel';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { useOverlays } from '../ui/useOverlays';
import { onboardingCreatine } from './onboardingCreatine';
import { weightEventIcon } from './weightEventIcon';
import { WeightEventEntrySheet } from './WeightEventEntrySheet';

const same = (a: WeightEvent, b: WeightEvent) => a.date === b.date && a.type === b.type;

/**
 * The things the user has noted that move the scale without being fat or
 * muscle: illness, travel, a training change, a big meal, creatine. A
 * section with the add action in its header and one row per event, newest
 * first, each with its icon and what it does to the trend (MM-257).
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
          Note illness, travel, a training change, a big meal or creatine here, so the trend can tell water from
          tissue.
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
    return [...all].reverse().map((event) => (
      <MmListRow
        key={`${event.date.epochDay}-${event.type}`}
        leadingIcon={weightEventIcon(event.type)}
        title={weightEventLabel(event.type)}
        subtitle={`${Fmt.day(event.date, today)} · ${effect(event)}`}
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
    ));
  };

  return (
    <MmSection
      icon="calendar"
      title="Weight events"
      trailing={
        <MmIconButton
          icon="plus"
          kind="add"
          label="Add a weight event"
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
    </MmSection>
  );
}
