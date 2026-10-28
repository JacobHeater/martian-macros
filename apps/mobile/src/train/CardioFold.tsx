import { CardioActivityBars } from '../charts/CardioActivityBars';
import { CardioWeekFigures } from '../charts/CardioWeekFigures';
import { StepsByDayChart } from '../charts/StepsByDayChart';
import { cardioActivityLabel } from '../format/cardioActivityLabel';
import { cardioDisclosureText } from '../format/cardioDisclosureText';
import { clockTimeText } from '../format/clockTimeText';
import { Fmt } from '../format/Fmt';
import { healthPlatformName } from '../format/healthPlatformName';
import { minutesText } from '../format/minutesText';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';

/**
 * Cardio from the wearable as a fold on Train (MM-677, MM-680, the owner):
 * closed, one line with steps a day and the week's minutes, or what would
 * bring them; open, drawn: the two figures, the steps of the last seven
 * days as bars on the floor's line, the minutes by activity as bars, and
 * the sessions one tap down. Nothing is timed or typed here; the floors are
 * changed in Settings › Coach.
 */
export function CardioFold() {
  const { services, state } = useApp();
  const week = useCell(state.cardioWeek);
  const connection = useLoaded(state.healthConnection);
  const platform = healthPlatformName(services.platform);
  let summary: string;
  if (Loadable.hasFailed(week)) summary = 'Could not read your sessions and steps.';
  else if (!week.ready) summary = 'Reading your watch…';
  else if (!week.value.inUse) summary = cardioDisclosureText(connection, platform);
  else {
    const { current } = week.value;
    const stepsPart = current.stepsPerDay === undefined ? 'No steps counted' : `About ${Fmt.whole(current.stepsPerDay)} steps a day`;
    summary = `${stepsPart} · ${minutesText(current.minutes)} of cardio this week`;
  }
  return (
    <MmSection icon="walk" title="Cardio" summary={summary} collapsible initiallyExpanded={false} remember="train.cardio">
      {Loadable.hasFailed(week) ? (
        <ReadFailedNotice title="Could not read your sessions and steps" onRetry={() => state.retryCardioWeek()} />
      ) : !week.ready ? null : (
        <>
          <CardioWeekFigures week={week.value} />
          <StepsByDayChart steps={week.value.steps} today={week.value.today} floor={week.value.floors.stepsPerDay} />
          <CardioActivityBars current={week.value.current} previous={week.value.previous} floorMinutes={week.value.floors.minutesPerWeek} />
          <MmDisclosure title="Sessions this week" remember="train.cardio.sessions">
            {week.value.sessions.length === 0 ? (
              <p className="app-text">Nothing recorded on the watch in the last seven days.</p>
            ) : (
              week.value.sessions.map((session) => (
                <MmListRow
                  key={session.platformId}
                  dense
                  title={`${cardioActivityLabel(session.activity)} · ${minutesText(session.minutes)}`}
                  subtitle={`${Fmt.day(session.date, week.value.today)} · ${clockTimeText(session.start)}${session.sourceName === '' ? '' : ` · from ${session.sourceName}`}`}
                />
              ))
            )}
          </MmDisclosure>
          <MmDisclosure title="How to read this" remember="train.cardio.how">
            <p className="app-text">
              From your watch through {platform}: every session that is not strength, and the steps your phone or watch
              counted. The line across the bars is the steps floor; the band on each activity starts at the minutes floor.
              Nothing is turned into calories. The floors are changed in Settings › Coach.
            </p>
          </MmDisclosure>
        </>
      )}
    </MmSection>
  );
}
