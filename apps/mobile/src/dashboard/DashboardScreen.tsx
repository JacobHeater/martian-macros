import { usePaceInWords } from '../coach/usePaceInWords';
import { useEffect, useState } from 'react';
import { InsightCard } from '../coach/InsightCard';
import { RowWithInsight } from '../coach/RowWithInsight';
import type { InlineInsightContent } from '../coach/InlineInsightContent';
import { MaintenanceRule } from '../engine/MaintenanceRule';
import { reboundText } from '../format/reboundText';
import { useInsightPreview } from '../coach/useInsightPreview';
import { useItemInsightContents } from '../coach/useItemInsightContents';
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
import { dayTargetsOn } from '../state/dayTargetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useHeldFailure } from '../app/useHeldFailure';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { AlcoholLine } from '../food/AlcoholLine';
import { CalorieHero } from '../food/CalorieHero';
import { PauseScreen } from '../pause/PauseScreen';
import { saveWaistReadings } from '../progress/saveWaistReadings';
import { useWeightJump } from '../progress/useWeightJump';
import { weightJumpContent } from '../progress/weightJumpContent';
import { ReminderPausedNotice } from '../reminders/ReminderPausedNotice';
import { MmSection } from '../ui/MmSection';
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
import { WeightDisplayOfferCard } from './WeightDisplayOfferCard';

/**
 * How the user is doing today, in tiers (MM-254): the safety notices, the
 * hero, the rhythm of the last seven days, then the week's facts as rows
 * that each open their destination, and the history one tap down.
 */
export function DashboardScreen() {
  const { services, state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const paceInWords = usePaceInWords();
  const overlays = useOverlays();
  const navigator = useNavigator();
  const setupState = useCell(state.setup);
  const pausesState = useCell(state.pauses);
  // Asked again after a failure, the day stays drawn and the button keeps its place (MM-183).
  const pausesRead = useHeldFailure(pausesState, () => state.retryPauses());
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
  // Today's targets as the user shaped them (MM-122, MM-124).
  const shapes = useLoaded(state.targetShapes) ?? [];
  const shapeLimits = useCell(state.targetShapeLimits);
  // The coach's lines under the weigh-in, waist and water (MM-367): none in the app until they are built.
  const rowNotes = useInsightPreview().rowNotes;
  // The coach's lines under the waist and water rows (MM-367), unless a design story hands in its own.
  const latestWaistDay = (useLoaded(state.waist) ?? []).reduce<number | undefined>((last, w) => Math.max(last ?? 0, w.date.epochDay), undefined);
  const waistOwn = useItemInsightContents({ kind: 'waist', id: `${latestWaistDay ?? 0}` }, 'Waist');
  const waterOwn = useItemInsightContents({ kind: 'water', id: `${useCell(state.today).epochDay}` }, 'Water');
  const maintenance = useCell(state.maintenance);
  // After a save in place, focus moves to the row that takes the entry's place (MM-304, UX-5), once.
  const [justSaved, setJustSaved] = useState<'weight' | 'waist'>();
  const savedOn = useCell(state.today);
  const weighedToday = (useLoaded(state.weights) ?? []).some((w) => w.date === savedOn);
  const waistSavedToday = (useLoaded(state.waist) ?? []).some((w) => w.date === savedOn);
  useEffect(() => {
    // Cleared only once the replacing row exists: with a slow store it mounts after the save's own commit (the panel's F3).
    if (justSaved === 'weight' && weighedToday) setJustSaved(undefined);
    if (justSaved === 'waist' && waistSavedToday) setJustSaved(undefined);
  }, [justSaved, weighedToday, waistSavedToday]);
  // Why today's weigh-in is far from the trend, when it is (MM-142), under the row once it is saved.
  const jump = useWeightJump(weighedToday ? savedOn : undefined);
  const designedRow = (row: 'weight' | 'waist' | 'water') => {
    const note = rowNotes?.get(row);
    return note === undefined ? undefined : [note];
  };
  const waistNotes = designedRow('waist') ?? waistOwn;
  const waterNotes = designedRow('water') ?? waterOwn;

  // The app shows nothing below its root until the profile is read, and says so there when it fails (AppRoot).
  const setup = Loadable.valueOf(setupState);
  if (setup === undefined) return null;
  // Pauses that cannot be read take out only what they decide: the day is drawn without them (MM-334).
  const pausesFailed = pausesRead.failed;
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
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  // Under the weigh-in for two weeks after a cut (MM-130): why the scale rises, before it does.
  const weightOwn: InlineInsightContent[] = jump === undefined ? [] : [weightJumpContent(jump, fmt, today, 'dashboard')];
  if (
    maintenance !== undefined &&
    maintenance.fromDeficitWeeks > 0 &&
    maintenance.startedOn.daysUntil(today) < MaintenanceRule.reboundNoteDays
  ) {
    weightOwn.push({
      line: reboundText(fmt),
      evidence: [
        ['Maintenance began', Fmt.day(maintenance.startedOn, today)],
        ['The cut before it', `${maintenance.fromDeficitWeeks} weeks`],
      ],
      area: 'body',
      rule: 'Leaving a deficit',
    });
  }
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
  // A save on the Dashboard is confirmed with what was typed, and offers where it is kept (MM-294, MM-301):
  // the weigh-in's opens Progress at the top, the waist's at its Waist section, unfolded (MM-304).
  const confirm = (message: string, shows?: 'waist') =>
    overlays.snack(message, {
      label: 'Open Progress',
      onAction: () => {
        if (shows === 'waist') {
          state.folds.put(new Map(state.folds.peek()).set('progress.waist', true));
          state.progressReveal.put('waist');
        } else {
          state.destinationScroll.put(new Map(state.destinationScroll.peek()).set('progress', 0));
        }
        open('progress');
      },
    });
  const trainedThisWeek = workouts.filter(
    (workout) => !workout.inProgress && today.daysUntil(workout.date) > -7 && !workout.date.isAfter(today),
  ).length;

  // Without the pauses, today may be paused: no targets are shown as though it were not (MM-183).
  let heroTargets = pause !== undefined ? guide : dayTargetsOn({ history, day: today, shapes, limits: shapeLimits, targetsAllowed });
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
          onRetry={pausesRead.retry}
          pending={pausesRead.pending}
        />
      ) : null}
      <UnderEatingNotice />
      <ReminderPausedNotice />
      <ReliefOfferCard />
      <WeightDisplayOfferCard />
      <ReportReadyNotice />
      <CalorieHero
        intake={intake}
        entries={entries}
        targets={heroTargets}
        paused={pause !== undefined}
        status={heroStatus}
        lines={
          // Today's alcohol, as on Food, at every detail level (MM-127).
          <AlcoholLine entries={entries} />
        }
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
              setJustSaved('weight');
              await services.weights.saveWeight(today, kg);
              // No echo of the reading unless every reading is shown (MM-118).
              confirm(fmt.readingsShown ? `Saved ${fmt.weight(kg)} for today` : 'Saved');
            }}
          />
        ) : last === undefined || trend.length < 2 ? (
          <MmListRow
            leadingIcon="scale"
            title={fmt.readingsShown ? fmt.weight(todaysWeight.weightKg) : 'Weighed in today'}
            subtitle={fmt.readingsShown ? 'Today’s weigh-in · the trend starts tomorrow' : 'The trend starts tomorrow'}
            opens
            autoFocus={justSaved === 'weight'}
            onPress={() => open('progress')}
          />
        ) : (
          <RowWithInsight insights={designedRow('weight') ?? weightOwn}>
            <MmListRow
              leadingIcon="scale"
              autoFocus={justSaved === 'weight'}
              // Trend only shows no reading; Hidden no figure, the pace in words instead (MM-118).
              title={fmt.weightHidden ? (paceInWords ?? 'Weighed in today') : `Trend ${fmt.weight(last.levelKg)}`}
              subtitle={
                fmt.weightHidden
                  ? 'Weighed in today · against your plan’s pace'
                  : [
                      ...(fmt.readingsShown ? [`Today ${fmt.weight(todaysWeight.weightKg)}`] : []),
                      ...(weekAgo === undefined ? [] : [`7 days ${fmt.weightDelta(last.levelKg - weekAgo.levelKg)}`]),
                    ].join(' · ') || 'Weighed in today'
              }
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
              setJustSaved('waist');
              await saveWaistReadings(services.waist, today, [cm]);
              confirm(`Waist saved: ${waistAmount(cm, fmt)}`, 'waist');
            }}
          />
        ) : (
          <RowWithInsight insights={waistNotes}>
            <MmListRow
              leadingIcon="tape"
              autoFocus={justSaved === 'waist'}
              title={waistAmount(latestWaist.waistCm, fmt)}
              subtitle={`Waist · ${Fmt.day(latestWaist.date, today)}`}
              opens
              onPress={() => open('progress')}
            />
          </RowWithInsight>
        )}
        <RowWithInsight insights={waterNotes}>
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
      {/* Named for 7 or 30 days, not for a week (MM-176); a section like the other screens' (owner), not a bare disclosure. */}
      <MmSection
        icon="history"
        title="History"
        summary="Intake, weight and more, 7 or 30 days back"
        // Its sections bring their own icon column: indented under the title as well, a chart stood 72 px in (MM-583).
        flush
        collapsible
        initiallyExpanded={false}
        remember="dashboard.more"
      >
        <DashboardMetrics pausesUnchecked={pausesFailed} />
      </MmSection>
    </>
  );
}
