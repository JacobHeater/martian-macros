import type { CalendarDate } from '../domain/CalendarDate';
import { GoalMode } from '../domain/GoalMode';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays } from '../engine/coachConstants';
import type { CoachSnapshot } from '../engine/CoachSnapshot';
import { nextCheckIn } from '../engine/nextCheckIn';
import { TdeeEstimator } from '../engine/TdeeEstimator';
import { cautionMessage } from '../format/cautionMessage';
import { confidenceLabel } from '../format/confidenceLabel';
import { confidenceNextStepText } from '../format/confidenceNextStepText';
import { Fmt } from '../format/Fmt';
import { goalModeBlurb } from '../format/goalModeBlurb';
import { goalModeLabel } from '../format/goalModeLabel';
import { targetFlagMessage } from '../format/targetFlagMessage';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { Loadable } from '../state/Loadable';
import { HealthRecheckScreen } from '../app/HealthRecheckScreen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { WeighInRow } from '../dashboard/WeighInRow';
import { CalorieHero } from '../food/CalorieHero';
import { PauseBanner } from '../pause/PauseBanner';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListGroup } from '../ui/MmListGroup';
import { MmSection } from '../ui/MmSection';
import { Notice } from '../ui/Notice';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';
import { AdherenceCard } from './AdherenceCard';
import { LastChangeCard } from './LastChangeCard';
import { RecentInsightsSection } from './RecentInsightsSection';
import { useInsightPreview } from './useInsightPreview';
import { useRecentInsights } from './useRecentInsights';
import { MetabolismSummary } from './MetabolismSummary';
import { OneThingRow } from './OneThingRow';
import { RecompReviewCard } from './RecompReviewCard';
import { RecoveryCard } from './RecoveryCard';
import { ReliefOfferCard } from './ReliefOfferCard';
import { ReportsCard } from './ReportsCard';
import { StallCard } from './StallCard';
import { TargetsHistoryScreen } from './TargetsHistoryScreen';
import { UnderEatingNotice } from './UnderEatingNotice';
import './coach.css';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;
const more = (count: number, what: string) => `${count} more ${what}${count === 1 ? '' : 's'}`;

/** The pace in weight, worded as approximate until the coach is sure. */
function paceDetail(snapshot: CoachSnapshot, rate: number, fmt: Fmt): string | undefined {
  if (rate === 0) return undefined;
  const change = `${fmt.weightDelta(rate * snapshot.trendWeightKg)} a week`;
  return snapshot.confidence.level === 'good' ? change : `About ${change} so far`;
}

/**
 * After calibration, while the estimate is held for lack of data, targets
 * stay as they are; say so, and what is needed.
 */
function holdNote(setup: UserSetup, snapshot: CoachSnapshot, today: CalendarDate): string | undefined {
  if (snapshot.creatineReductionPausedOn(today)) {
    return 'Calorie reductions are paused while your creatine change settles. Safety corrections still apply.';
  }
  if (setup.onboardedOn.daysUntil(today) < calibrationDays || snapshot.tdee.status !== 'held') return undefined;
  const estimator = new TdeeEstimator();
  const days = estimator.minIntakeDays - snapshot.tdee.usableIntakeDays;
  const weighIns = estimator.minWeighIns - snapshot.tdee.weighIns;
  const needs: string[] = [];
  if (days > 0) needs.push(more(days, 'fully logged day'));
  if (weighIns > 0) needs.push(more(weighIns, 'weigh-in'));
  return (
    'Targets are unchanged because there is not enough data yet.' +
    `${needs.length === 0 ? '' : ` Needs ${needs.join(' and ')}.`}`
  );
}

/**
 * What the engine believes, why, and what it will do next, in tiers
 * (MM-256): the safeguards above everything, the hero with the confidence
 * word and its warnings, the goal (MM-299), one thing to do, then sections
 * with icons; the sections with nothing new are folded to a line.
 */
export function CoachScreen() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const setup = useLoaded(state.setup);
  const snapshot = useCell(state.coach);
  const current = useCell(state.currentTargets);
  const today = useCell(state.today);
  const pause = useCell(state.activePause);
  const guide = useCell(state.maintenanceGuide);
  const food = useLoaded(state.foodForDay(today)) ?? [];
  const history = useLoaded(state.targetsHistory) ?? [];
  const weights = useCell(state.weights);
  // What the coach works from; any of it unread leaves the coach with nothing to say (MM-340).
  const sources = [weights, useCell(state.weightEvents), useCell(state.intakeDays), useCell(state.targetsHistory), useCell(state.pauses)];
  // What the coach said inline (MM-363), or a design story's own list.
  const logged = useRecentInsights();
  const recent = useInsightPreview().recent ?? logged;

  if (setup === undefined) return null;
  if (snapshot === undefined) {
    if (sources.some((source) => Loadable.hasFailed(source))) {
      return <ReadFailedNotice title="Could not read what your coach works from" onRetry={() => state.retryCoach()} />;
    }
    if (Loadable.valueOf(weights)?.length !== 0) return <ScreenLoading />;
    // Nothing to coach from yet: the weigh-in it asks for, in the row the Dashboard asks with (MM-340).
    const fmt = new Fmt(setup.unitSystem);
    return (
      <MmListGroup>
        <WeighInRow
          fmt={fmt}
          lastTrendKg={undefined}
          note="Log a weigh-in to get started."
          onSaveWeight={async (kg) => {
            await services.weights.saveWeight(today, kg);
            overlays.snack(`Saved ${fmt.weight(kg)} for today`, {
              label: 'Open Progress',
              onAction: () => state.homeTab.put('progress'),
            });
          }}
        />
      </MmListGroup>
    );
  }
  const fmt = new Fmt(setup.unitSystem);

  const changeGoal = async () => {
    const chosen = await overlays.sheet<GoalMode>('Choose a goal', (close) => (
      <div className="coach-sheet">
        <h2 className="app-headline">Choose a goal</h2>
        {GoalMode.values
          .filter((mode) => snapshot.policy.allowedModes.has(mode))
          .map((mode) => (
            <ChoiceCard
              key={mode}
              label={goalModeLabel(mode)}
              detail={goalModeBlurb(mode)}
              selected={mode === setup.goalMode}
              badge={mode === snapshot.recommendation.mode ? 'Recommended' : undefined}
              onPress={() => close(mode)}
            />
          ))}
      </div>
    ));
    if (chosen === undefined || chosen === setup.goalMode) return;
    if (chosen === 'fatLoss' || chosen === 'recomp') {
      // A deficit is confirmed against the health check before it is kept.
      await navigator.push<boolean>((close) => (
        <HealthRecheckScreen pendingGoal={chosen} allowSkip={setup.healthCheckSkipCount < 2} onDone={close} />
      ));
      return;
    }
    await services.setup.saveSetup(setup.copyWith({ goalMode: chosen }));
  };

  const detail = current === undefined ? undefined : paceDetail(snapshot, current.targets.weeklyRateFraction, fmt);
  const confidence = confidenceLabel(snapshot.confidence.level);
  return (
    <>
      {/* The safeguards are outside the rationing: above the hero, in full, in this order. */}
      {[...snapshot.policy.cautions].map((caution) => (
        <div key={caution} className="app-stack-item">
          <Notice kind="caution" text={cautionMessage(caution)} />
        </div>
      ))}
      <PauseBanner />
      <UnderEatingNotice />
      <ReliefOfferCard />
      {current === undefined ? null : (
        <>
          {/* The one calorie visual (MM-187): today against the targets in force, or the guide during a pause. */}
          <CalorieHero
            intake={intakeDayFrom(today, food)}
            entries={food}
            targets={pause !== undefined ? guide : current.targets}
            paused={pause !== undefined}
            status={`Next check-in ${Fmt.day(nextCheckIn(setup, current), today)}`}
            confidence={confidence}
            onStatusPress={() => void navigator.push(() => <TargetsHistoryScreen />)}
          />
          {[...current.targets.flags].map((flag) => (
            <div key={flag} className="app-stack-item">
              <Notice kind="caution" text={targetFlagMessage(flag)} />
            </div>
          ))}
        </>
      )}
      {/* The goal first, under the figures and the warnings (MM-299). */}
      <MmSection
        icon="flag"
        title={`Goal: ${goalModeLabel(setup.goalMode)}`}
        trailing={<MmButton label="Change goal" kind="text" onPress={() => void changeGoal()} />}
      >
        <p className="app-text">{goalModeBlurb(setup.goalMode)}</p>
      </MmSection>
      <OneThingRow />
      {current === undefined ? null : (
        <MmSection icon="tune" title="Your targets">
          {current.targets.proteinMinimumG === undefined ? null : (
            <StatRow label="Protein minimum" value={Fmt.grams(current.targets.proteinMinimumG)} />
          )}
          <StatRow
            label="Intended pace"
            value={
              current.targets.weeklyRateFraction === 0 ? 'Hold weight' : Fmt.percentPerWeek(current.targets.weeklyRateFraction)
            }
          />
          {detail === undefined ? null : <p className="app-caption coach-pace-detail">{detail}</p>}
          <StatRow label="Next check-in" value={Fmt.day(nextCheckIn(setup, current), today)} />
        </MmSection>
      )}
      <LastChangeCard history={history} today={today} holdNote={holdNote(setup, snapshot, today)} />
      {recent === undefined ? null : <RecentInsightsSection insights={recent} />}
      <StallCard />
      <RecompReviewCard />
      <AdherenceCard />
      <RecoveryCard />
      <ReportsCard />
      <MmSection icon="bolt" title="Your metabolism">
        <MetabolismSummary snapshot={snapshot} calibrating={setup.onboardedOn.daysUntil(today) < calibrationDays} />
      </MmSection>
      <MmSection icon="coach" title={`Coach confidence · ${confidence}`}>
        {snapshot.confidence.level === 'learning' ? (
          <p className="app-text">Targets are held while the coach learns.</p>
        ) : null}
        <p className="app-text">{confidenceNextStepText(snapshot.confidence)}</p>
        <MmDisclosure title="The numbers behind this">
          <StatRow label="Estimate" value={confidenceLabel(snapshot.confidence.estimate)} />
          <StatRow label="Food log" value={confidenceLabel(snapshot.confidence.foodLog)} />
          <StatRow label="Weigh-ins" value={confidenceLabel(snapshot.confidence.weighIns)} />
          <StatRow label="Stability" value={confidenceLabel(snapshot.confidence.stability)} />
        </MmDisclosure>
      </MmSection>
      <MmSection icon="body" title="Body">
        <StatRow label="Trend weight" value={fmt.weight(snapshot.trendWeightKg)} />
        <StatRow
          label="Body fat"
          value={
            setup.bodyFatPercent !== undefined
              ? `~${whole(snapshot.bodyFat.percent)}% (your estimate)`
              : `${whole(snapshot.bodyFat.lowerPercent)}–${whole(snapshot.bodyFat.upperPercent)}% (rough estimate)`
          }
        />
        <StatRow label="Resting energy (BMR)" value={Fmt.kcal(snapshot.bmrKcal)} />
      </MmSection>
    </>
  );
}
