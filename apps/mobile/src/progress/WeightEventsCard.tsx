import { ChartPlaceholder } from '../charts/ChartPlaceholder';
import { DayTrack } from '../charts/DayTrack';
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
 * first, each with its icon and what it does to the trend (MM-257). Above
 * the rows, the trend chart's days as a line with a dot on each event's, or
 * what the line waits for (MM-578). Folded to a line of how many fall in the
 * trend's range, beside its add action (MM-578).
 */
export function WeightEventsCard() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const events = useCell(state.weightEvents);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const rangeDays = useCell(state.progressRangeDays);

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
        <ChartPlaceholder
          text={
            'No weight events yet. Note illness, travel, a training change, a big meal or creatine here, so the trend ' +
            'can tell water from tissue. Each one is a dot on the trend’s days.'
          }
        />
      );
    }
    const start = today.addDays(1 - rangeDays);
    const inRange = all.filter((event) => !event.date.isBefore(start));
    const track =
      inRange.length === 0 ? (
        <ChartPlaceholder text={`None in the last ${rangeDays} days, the trend chart’s range. Earlier events are listed below.`} />
      ) : (
        <DayTrack
          days={rangeDays}
          today={today}
          marks={inRange.map((event) => event.date)}
          kind="event"
          label={
            `Weight events over the last ${rangeDays} days: ` +
            inRange.map((event) => `${weightEventLabel(event.type)}, ${Fmt.day(event.date, today)}`).join('; ') +
            '.'
          }
        />
      );
    const effective = effectiveWeightEvents(stored);
    const effect = (event: WeightEvent) => {
      if (event.type === 'startedCreatine' || event.type === 'stoppedCreatine') {
        return 'Creatine shift estimated across 21 days.';
      }
      return effective.some((active) => same(active, event))
        ? 'Scale noise widened around this event.'
        : 'Recorded only; two other events in this 14-day window already affect the trend.';
    };
    const rows = [...all].reverse().map((event) => (
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
    return (
      <>
        {track}
        {rows}
      </>
    );
  };

  // Folded to a line once the events are read (the owner, 2026-10-22, MM-578), as Sleep and Waist are; while they are
  // being read, or could not be, the section stays open so what it says is seen.
  let summary: string | undefined;
  if (events.ready) {
    const fromOnboarding = onboardingCreatine(events.value, setup);
    const known = [...events.value, ...(fromOnboarding === undefined ? [] : [fromOnboarding])];
    const shown = known.filter((event) => !event.date.isBefore(today.addDays(1 - rangeDays))).length;
    if (known.length === 0) summary = 'None noted yet.';
    else if (shown === 0) summary = `None in the last ${rangeDays} days; ${known.length} earlier.`;
    else summary = `${shown} in the last ${rangeDays} days.`;
  }

  return (
    <MmSection
      icon="calendar"
      title="Weight events"
      summary={summary}
      collapsible={events.ready}
      initiallyExpanded={false}
      remember="progress.weight-events"
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
        <p className="app-caption">Could not load weight events.</p>
      ) : (
        <p className="app-caption">Loading weight events...</p>
      )}
    </MmSection>
  );
}
