import { InsightCard } from '../coach/InsightCard';
import { RowWithInsight } from '../coach/RowWithInsight';
import { useInsightPreview } from '../coach/useInsightPreview';
import { useItemInsightContent } from '../coach/useItemInsightContent';
import { ReliefOfferCard } from '../coach/ReliefOfferCard';
import { UnderEatingNotice } from '../coach/UnderEatingNotice';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import { nextCheckIn } from '../engine/nextCheckIn';
import { ReminderRule } from '../engine/ReminderRule';
import { coachLineText } from '../format/coachLineText';
import { confidenceLabel } from '../format/confidenceLabel';
import { Fmt } from '../format/Fmt';
import { waistAmount } from '../format/waistAmount';
import type { HomeDestination } from '../state/HomeDestination';
import { Loadable } from '../state/Loadable';
import { targetsOn } from '../state/targetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { CalorieHero } from '../food/CalorieHero';
import { PauseScreen } from '../pause/PauseScreen';
import { saveWaistReadings } from '../progress/saveWaistReadings';
import { ReminderPausedNotice } from '../reminders/ReminderPausedNotice';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmRhythmStrip } from '../ui/MmRhythmStrip';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { useOverlays } from '../ui/useOverlays';
import { DashboardMetrics } from './DashboardMetrics';
import { ProcessCard } from './ProcessCard';
import { ReportReadyNotice } from './ReportReadyNotice';
import { rhythmDays } from './rhythmDays';
import { WaistRow } from './WaistRow';
import { WaterRow } from './WaterRow';
import { WeighInRow } from './WeighInRow';

/**
 * How the user is doing today, in tiers (MM-254): the safety notices, the
 * hero, the rhythm of the last seven days, then the week's facts as rows
 * that each open their destination, and the history one tap down.
 */
export function DashboardScreen() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const navigator = useNavigator();
  const setupState = useCell(state.setup);
  const pausesState = useCell(state.pauses);
  const today = useCell(state.today);
  const foodState = useCell(state.foodForDay(today));
  const historyState = useCell(state.targetsHistory);
  const weightsState = useCell(state.weights);
  const coach = useCell(state.coach);
  const pause = useCell(state.activePause);
  const guide = useCell(state.maintenanceGuide);
  const intakeDays = useLoaded(state.intakeDays) ?? [];
  const waist = useLoaded(state.waist) ?? [];
  const workouts = useLoaded(state.workouts) ?? [];
  const current = useCell(state.currentTargets);
  // The coach's lines under the weigh-in, waist and water (MM-367): none in the app until they are built.
  const rowNotes = useInsightPreview().rowNotes;
  // The coach's lines under the waist and water rows (MM-367), unless a design story hands in its own.
  const latestWaistDay = (useLoaded(state.waist) ?? []).reduce<number | undefined>((last, w) => Math.max(last ?? 0, w.date.epochDay), undefined);
  const waistNote = rowNotes?.get('waist') ?? useItemInsightContent({ kind: 'waist', id: `${latestWaistDay ?? 0}` }, 'Waist');
  const waterNote = rowNotes?.get('water') ?? useItemInsightContent({ kind: 'water', id: `${useCell(state.today).epochDay}` }, 'Water');

  // The app shows nothing below its root until the profile is read, and says so there when it fails (AppRoot).
  const setup = Loadable.valueOf(setupState);
  if (setup === undefined) return null;
  // Pauses that cannot be read take out only what they decide: the day is drawn without them (MM-334).
  const pausesFailed = Loadable.hasFailed(pausesState);
  if ([foodState, historyState, weightsState].some((source) => Loadable.hasFailed(source))) {
    return (
      <ReadFailedNotice
        title="Could not read today’s food, targets or weigh-ins"
        onRetry={() => state.retryDashboard()}
      />
    );
  }
  if ((!pausesState.ready && !pausesFailed) || !foodState.ready || !historyState.ready || !weightsState.ready) {
    return <ScreenLoading />;
  }
  const entries = foodState.value;
  const history = historyState.value;
  const weights = weightsState.value;
  const fmt = new Fmt(setup.unitSystem);
  const targetsAllowed = CoachingPolicy.derive({
    profile: setup.profile,
    screening: setup.screening,
    today,
  }).targetsAllowed;
  const open = (destination: HomeDestination) => state.homeTab.put(destination);
  const intake = intakeDayFrom(today, entries);

  const trend = coach?.trend ?? [];
  const last = trend[trend.length - 1];
  const weekAgo = trend.length > 7 ? trend[trend.length - 8] : undefined;
  const todaysWeight = weights.find((w) => w.date === today);
  const latestWaist = waist[waist.length - 1];
  // A measurement counts for a week, as it does for the weekly reminder (MM-301).
  const waistCounts =
    latestWaist !== undefined && latestWaist.date.daysUntil(today) < ReminderRule.measurementEveryDays;
  // A save on the Dashboard is confirmed with what was typed, and offers where it is kept (MM-294, MM-301).
  const confirm = (message: string) =>
    overlays.snack(message, { label: 'Open Progress', onAction: () => open('progress') });
  const trainedThisWeek = workouts.filter(
    (workout) => !workout.inProgress && today.daysUntil(workout.date) > -7 && !workout.date.isAfter(today),
  ).length;

  // Without the pauses, today may be paused: no targets are shown as though it were not (MM-183).
  let heroTargets = pause !== undefined ? guide : targetsOn(history, today, { targetsAllowed })?.targets;
  let heroStatus: string | undefined =
    pause !== undefined
      ? `Paused until ${Fmt.day(pause.to, today)}. Nothing is counted against you.`
      : coachLineText({ setup, history, today, confidence: coach?.confidence.level ?? 'learning' });
  // Nor the coach's line about them: the notice above says why they are missing.
  if (pausesFailed) [heroTargets, heroStatus] = [undefined, undefined];

  return (
    <>
      {pausesFailed ? (
        <ReadFailedNotice
          title="Could not check whether today is paused"
          consequence="Today’s targets are not shown until it can."
          onRetry={() => state.retryPauses()}
        />
      ) : null}
      <UnderEatingNotice />
      <ReminderPausedNotice />
      <ReliefOfferCard />
      <ReportReadyNotice />
      <CalorieHero
        intake={intake}
        entries={entries}
        targets={heroTargets}
        paused={pause !== undefined}
        status={heroStatus}
        confidence={coach === undefined || pause !== undefined ? undefined : confidenceLabel(coach.confidence.level)}
        onStatusPress={
          pause !== undefined ? () => void navigator.push(() => <PauseScreen />) : () => open('coach')
        }
        onPress={() => {
          state.selectedDay.put(undefined);
          open('food');
        }}
        pressLabel="Open today’s food"
      />
      <div className="food-rhythm">
        <MmRhythmStrip
          name="Last seven days"
          days={rhythmDays(intakeDays, today)}
          onSelect={(key) => {
            const date = today.addDays(Number(key) - today.epochDay);
            state.selectedDay.put(date === today ? undefined : date);
            open('food');
          }}
        />
      </div>
      <InsightCard />
      <MmListGroup>
        {todaysWeight === undefined ? (
          <WeighInRow
            fmt={fmt}
            lastTrendKg={last?.levelKg}
            onSaveWeight={async (kg) => {
              await services.weights.saveWeight(today, kg);
              confirm(`Saved ${fmt.weight(kg)} for today`);
            }}
          />
        ) : last === undefined || trend.length < 2 ? (
          <MmListRow
            leadingIcon="scale"
            title={fmt.weight(todaysWeight.weightKg)}
            subtitle="Today’s weigh-in · the trend starts tomorrow"
            opens
            onPress={() => open('progress')}
          />
        ) : (
          <RowWithInsight insight={rowNotes?.get('weight')}>
            <MmListRow
              leadingIcon="scale"
              title={`Trend ${fmt.weight(last.levelKg)}`}
              subtitle={[
                `Today ${fmt.weight(todaysWeight.weightKg)}`,
                ...(weekAgo === undefined ? [] : [`7 days ${fmt.weightDelta(last.levelKg - weekAgo.levelKg)}`]),
              ].join(' · ')}
              opens
              onPress={() => open('progress')}
            />
          </RowWithInsight>
        )}
        {latestWaist === undefined || !waistCounts ? (
          <WaistRow
            fmt={fmt}
            last={
              latestWaist === undefined
                ? undefined
                : `Last ${waistAmount(latestWaist.waistCm, fmt)} · ${Fmt.day(latestWaist.date, today)}`
            }
            onSaveWaist={async (cm) => {
              await saveWaistReadings(services.waist, today, [cm]);
              confirm(`Waist saved: ${waistAmount(cm, fmt)}`);
            }}
          />
        ) : (
          <RowWithInsight insight={waistNote}>
            <MmListRow
              leadingIcon="tape"
              title={waistAmount(latestWaist.waistCm, fmt)}
              subtitle={`Waist · ${Fmt.day(latestWaist.date, today)}`}
              opens
              onPress={() => open('progress')}
            />
          </RowWithInsight>
        )}
        <RowWithInsight insight={waterNote}>
          <WaterRow today={today} />
        </RowWithInsight>
        {current === undefined ? null : (
          <MmListRow
            leadingIcon="calendarCheck"
            title={Fmt.day(nextCheckIn(setup, current), today)}
            subtitle="Next check-in"
            opens
            onPress={() => open('coach')}
          />
        )}
        <MmListRow
          leadingIcon="train"
          title={trainedThisWeek === 1 ? '1 workout this week' : `${trainedThisWeek} workouts this week`}
          opens
          onPress={() => open('train')}
        />
        <ProcessCard />
      </MmListGroup>
      <MmDisclosure title="More about this week" subtitle="Intake, protein, weight, waist, coverage and recovery, 7 or 30 days back">
        <DashboardMetrics />
      </MmDisclosure>
    </>
  );
}
