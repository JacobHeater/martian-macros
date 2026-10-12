import { MacroSplitChart } from '../charts/MacroSplitChart';
import { InsightCard } from '../coach/InsightCard';
import { ReliefOfferCard } from '../coach/ReliefOfferCard';
import { UnderEatingNotice } from '../coach/UnderEatingNotice';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import { coachLineText } from '../format/coachLineText';
import { confidenceLabel } from '../format/confidenceLabel';
import { Fmt } from '../format/Fmt';
import type { HomeDestination } from '../state/HomeDestination';
import { Loadable } from '../state/Loadable';
import { targetsOn } from '../state/targetsOn';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { CalorieHero } from '../food/CalorieHero';
import { PauseScreen } from '../pause/PauseScreen';
import { ReminderPausedNotice } from '../reminders/ReminderPausedNotice';
import { InfoCard } from '../ui/InfoCard';
import { Notice } from '../ui/Notice';
import { DashboardMetrics } from './DashboardMetrics';
import { ProcessCard } from './ProcessCard';
import { ReportReadyNotice } from './ReportReadyNotice';
import { WeightCard } from './WeightCard';
import './dashboard.css';

/** How the user is doing today, with a way into each detail screen. */
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
      <InfoCard title="Macronutrient split">
        <MacroSplitChart intake={intake} />
      </InfoCard>
      <WeightCard
        trend={coach?.trend ?? []}
        weighedInToday={weights.some((w) => w.date === today)}
        fmt={fmt}
        onSaveWeight={(kg) => services.weights.saveWeight(today, kg)}
        onPress={() => open('progress')}
      />
      <InsightCard />
      <ProcessCard />
      <DashboardMetrics />
    </>
  );
}
