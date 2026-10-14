import { InsightCard } from '../coach/InsightCard';
import { ReliefOfferCard } from '../coach/ReliefOfferCard';
import { UnderEatingNotice } from '../coach/UnderEatingNotice';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import { nextCheckIn } from '../engine/nextCheckIn';
import { coachLineText } from '../format/coachLineText';
import { confidenceLabel } from '../format/confidenceLabel';
import { Fmt } from '../format/Fmt';
import type { HomeDestination } from '../state/HomeDestination';
import { Loadable } from '../state/Loadable';
import { targetsOn } from '../state/targetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { CalorieHero } from '../food/CalorieHero';
import { PauseScreen } from '../pause/PauseScreen';
import { ReminderPausedNotice } from '../reminders/ReminderPausedNotice';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmRhythmStrip } from '../ui/MmRhythmStrip';
import { Notice } from '../ui/Notice';
import { DashboardMetrics } from './DashboardMetrics';
import { ProcessCard } from './ProcessCard';
import { ReportReadyNotice } from './ReportReadyNotice';
import { rhythmDays } from './rhythmDays';
import { WeighInSection } from './WeighInSection';
import './dashboard.css';

/**
 * How the user is doing today, in tiers (MM-254): the safety notices, the
 * hero, the rhythm of the last seven days, then the week's facts as rows
 * that each open their destination, and the history one tap down.
 */
export function DashboardScreen() {
  const { services, state } = useApp();
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

  if (Loadable.hasFailed(setupState)) {
    return <Notice kind="caution" text="Your profile could not be loaded. Reopen the app to retry." />;
  }
  const setup = Loadable.valueOf(setupState);
  if (setup === undefined) return null;
  if (Loadable.hasFailed(pausesState)) {
    return <Notice kind="caution" text="Pause history could not be loaded. Reopen the app to retry." />;
  }
  if (!pausesState.ready) return <p className="app-text app-centered">Loading pause history…</p>;
  if ([foodState, historyState, weightsState].some((source) => Loadable.hasFailed(source))) {
    return <Notice kind="caution" text="Dashboard records could not be loaded. Reopen the app to retry." />;
  }
  if (!foodState.ready || !historyState.ready || !weightsState.ready) {
    return <p className="app-text app-centered">Loading your Dashboard…</p>;
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
  const weighedToday = weights.some((w) => w.date === today);
  const latestWaist = waist[waist.length - 1];
  const trainedThisWeek = workouts.filter(
    (workout) => !workout.inProgress && today.daysUntil(workout.date) > -7 && !workout.date.isAfter(today),
  ).length;

  return (
    <>
      <UnderEatingNotice />
      <ReminderPausedNotice />
      <ReliefOfferCard />
      <ReportReadyNotice />
      <CalorieHero
        intake={intake}
        targets={pause !== undefined ? guide : targetsOn(history, today, { targetsAllowed })?.targets}
        paused={pause !== undefined}
        status={
          pause !== undefined
            ? `Paused until ${Fmt.day(pause.to, today)}. Nothing is counted against you.`
            : coachLineText({ setup, history, today, confidence: coach?.confidence.level ?? 'learning' })
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
      <ProcessCard />
      <InsightCard />
      {weighedToday && last !== undefined ? null : (
        <WeighInSection fmt={fmt} onSaveWeight={(kg) => services.weights.saveWeight(today, kg)} />
      )}
      <MmListGroup>
        {weighedToday && last !== undefined ? (
          <MmListRow
            leadingIcon="scale"
            title={fmt.weight(last.levelKg)}
            subtitle={`Trend weight · Last 7 days ${weekAgo === undefined ? '—' : fmt.weightDelta(last.levelKg - weekAgo.levelKg)}`}
            opens
            onPress={() => open('progress')}
          />
        ) : null}
        <MmListRow
          leadingIcon="tape"
          title={latestWaist === undefined ? 'No waist measurement yet' : fmt.length(latestWaist.waistCm)}
          subtitle={latestWaist === undefined ? 'Waist · measure it in Progress' : `Waist · ${Fmt.day(latestWaist.date, today)}`}
          opens
          onPress={() => open('progress')}
        />
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
          subtitle="Training"
          opens
          onPress={() => open('train')}
        />
      </MmListGroup>
      <MmDisclosure title="More about this week" subtitle="Intake, protein, weight, waist, coverage and recovery, 7 or 30 days back">
        <DashboardMetrics />
      </MmDisclosure>
    </>
  );
}
