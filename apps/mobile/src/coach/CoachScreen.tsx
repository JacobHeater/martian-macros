import type { CalendarDate } from '../domain/CalendarDate';
import { GoalMode } from '../domain/GoalMode';
import { intakeDayFrom } from '../domain/intakeDayFrom';
import type { UserSetup } from '../domain/UserSetup';
import { calibrationDays } from '../engine/coachConstants';
import type { CoachSnapshot } from '../engine/CoachSnapshot';
import { breakInForce } from '../engine/breakInForce';
import { MaintenanceRule } from '../engine/MaintenanceRule';
import { nextCheckIn } from '../engine/nextCheckIn';
import { TdeeEstimator } from '../engine/TdeeEstimator';
import { bodyFatNote } from '../format/bodyFatNote';
import { bodyFatRangeText } from '../format/bodyFatRangeText';
import { cautionMessage } from '../format/cautionMessage';
import { confidenceLabel } from '../format/confidenceLabel';
import { confidenceNextStepText } from '../format/confidenceNextStepText';
import { Fmt } from '../format/Fmt';
import { displayTargets } from '../format/displayTargets';
import { FatLossPace } from '../engine/FatLossPace';
import { PhaseRule } from '../engine/PhaseRule';
import { SafetyBounds } from '../engine/SafetyBounds';
import { goalBodyFatSubtitle } from '../format/goalBodyFatSubtitle';
import { quantityText } from '../format/quantityText';
import { leanGainPaceName } from '../format/leanGainPaceName';
import { paceName } from '../format/paceName';
import { reboundText } from '../format/reboundText';
import { goalModeBlurb } from '../format/goalModeBlurb';
import { goalModeLabel } from '../format/goalModeLabel';
import { trainingGoalNote } from '../format/trainingGoalNote';
import { trainingMeaning } from '../format/trainingMeaning';
import { trainsNotYet } from '../format/trainsNotYet';
import { targetFlagMessage } from '../format/targetFlagMessage';
import { weightLossMedicationPaceNote } from '../format/weightLossMedicationPaceNote';
import { weightLossMedicationTrainingNote } from '../format/weightLossMedicationTrainingNote';
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
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { Notice } from '../ui/Notice';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';
import { AdherenceCard } from './AdherenceCard';
import { DataGapNote } from './DataGapNote';
import { GoalBodyFatSheet } from './GoalBodyFatSheet';
import { dataGapsOf } from './dataGapsOf';
import { LastChangeCard } from './LastChangeCard';
import { LeanGainCard } from './LeanGainCard';
import { MaintenanceCard } from './MaintenanceCard';
import { RecentInsightsSection } from './RecentInsightsSection';
import { useInsightPreview } from './useInsightPreview';
import { useRecentInsights } from './useRecentInsights';
import { MetabolismSummary } from './MetabolismSummary';
import { OneThingRow } from './OneThingRow';
import { PhaseRows } from './PhaseRows';
import { RecompReviewCard } from './RecompReviewCard';
import { RecoveryCard } from './RecoveryCard';
import { ReliefOfferCard } from './ReliefOfferCard';
import { ReportsCard } from './ReportsCard';
import { StallCard } from './StallCard';
import { TargetsHistoryScreen } from './TargetsHistoryScreen';
import { TrainingLapseNotice } from './TrainingLapseNotice';
import { UnderEatingNotice } from './UnderEatingNotice';
import { WhatToExpectScreen } from './WhatToExpectScreen';
import { useLeanGainPaceSheet } from './useLeanGainPaceSheet';
import { usePaceSheet } from './usePaceSheet';
import './coach.css';

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
  const openPaceSheet = usePaceSheet();
  const openLeanGainPaceSheet = useLeanGainPaceSheet();
  const setup = useLoaded(state.setup);
  const snapshot = useCell(state.coach);
  const current = useCell(state.currentTargets);
  const exactTargets = useLoaded(state.exactTargets) ?? false;
  const today = useCell(state.today);
  const pause = useCell(state.activePause);
  const guide = useCell(state.maintenanceGuide);
  const phase = useCell(state.phasePlan);
  const goalBodyFat = useLoaded(state.goalBodyFat);
  const food = useLoaded(state.foodForDay(today)) ?? [];
  const history = useLoaded(state.targetsHistory) ?? [];
  const weights = useCell(state.weights);
  const connection = useLoaded(state.healthConnection);
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
          note="The coach starts from your first weigh-in."
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

  // Someone who does not train yet sees what a gain or recomp rests on (MM-134).
  const notTraining = trainsNotYet(setup);
  // The one way a goal changes, chosen from the sheet or taken from the phase plan (MM-36).
  const applyGoal = async (chosen: GoalMode | undefined) => {
    if (chosen === undefined || chosen === setup.goalMode) return;
    if (chosen === 'leanGain' && notTraining) {
      // A surplus without training is the one case where the app would knowingly add fat: one acknowledgement.
      const acknowledged = await overlays.confirm({
        title: 'Lean gain without training',
        message: `${trainingGoalNote('leanGain') ?? ''} Without workouts logged, the surplus pauses after three weeks.`,
        confirmLabel: 'I understand, choose Lean gain',
        cancelLabel: 'Not now',
      });
      if (!acknowledged) return;
    }
    if (chosen === 'fatLoss' || chosen === 'recomp') {
      // A deficit is confirmed against the health check before it is kept.
      await navigator.push<boolean>((close) => (
        <HealthRecheckScreen pendingGoal={chosen} allowSkip={setup.healthCheckSkipCount < 2} onDone={close} />
      ));
      return;
    }
    await services.setup.saveSetup(setup.copyWith({ goalMode: chosen }));
  };
  const changeGoal = async () => {
    const chosen = await overlays.sheet<GoalMode>('Choose a goal', (close) => (
      <div className="coach-sheet">
        <h2 className="app-headline">Choose a goal</h2>
        {GoalMode.values
          .filter((mode) => snapshot.policy.allowedModes.has(mode))
          .map((mode) => {
            const note = notTraining ? trainingGoalNote(mode) : undefined;
            return (
              <ChoiceCard
                key={mode}
                label={goalModeLabel(mode)}
                detail={note === undefined ? goalModeBlurb(mode) : `${goalModeBlurb(mode)} ${note}`}
                selected={mode === setup.goalMode}
                badge={mode === snapshot.recommendation.mode ? 'Recommended' : undefined}
                onPress={() => close(mode)}
              />
            );
          })}
        {notTraining ? <p className="app-caption">{trainingMeaning}</p> : null}
      </div>
    ));
    await applyGoal(chosen);
  };

  // The goal body fat (MM-507): set from the goal section, refused under the hard floor, kept across restarts.
  const changeGoalBodyFat = async () => {
    const sex = setup.profile.sex;
    const answer = await overlays.sheet<number | 'default'>('Goal body fat', (close) => (
      <GoalBodyFatSheet sex={sex} current={goalBodyFat} onDone={close} />
    ));
    if (answer === undefined) return;
    if (answer === 'default') {
      await services.goalBodyFat.clearGoalBodyFat();
      overlays.snack(`The plan runs to its own line, ${PhaseRule.cutGoalPercent(sex)}%.`);
      return;
    }
    if (SafetyBounds.checkGoalBodyFat(sex, answer) === 'rejected') return;
    await services.goalBodyFat.saveGoalBodyFat({ percent: answer, setOn: today });
    overlays.snack(`Goal body fat set to ${quantityText(answer)}%.`);
  };

  const detail = current === undefined ? undefined : paceDetail(snapshot, current.targets.weeklyRateFraction, fmt);
  // A diet break brings the water back as leaving a cut does (MM-130): said under the break's notice while it does (MM-135, the panel's UX-5).
  const runningBreak = breakInForce(history, today);
  const breakRebound = runningBreak !== undefined && runningBreak.startedOn.daysUntil(today) < MaintenanceRule.reboundNoteDays;
  // Rounded as every screen shows them, unless the person asked for exact ones (MM-123).
  const shownTargets = current === undefined ? undefined : displayTargets(current.targets, { exact: exactTargets });
  const confidence = confidenceLabel(snapshot.confidence.level);
  const trendSigma = snapshot.trend[snapshot.trend.length - 1]?.levelSigmaKg;
  const bodyFatLine = bodyFatNote(snapshot.bodyFatBasis, { eatingDisorderHistory: setup.screening.eatingDisorderHistory });
  // On a weight-loss medication (MM-113, MM-510): the fast pace is for the prescriber, and training keeps muscle.
  const paceNote = current === undefined ? undefined : weightLossMedicationPaceNote(setup.screening, current.targets.flags);
  const trainingNote = weightLossMedicationTrainingNote(setup.screening, setup.trainingDaysPerWeek);
  // What the health platform's gaps cost, each beside the estimate it weakens (MM-523).
  const gaps = dataGapsOf({
    connection,
    confidence: snapshot.confidence,
    eatingDisorderHistory: setup.screening.eatingDisorderHistory,
  });
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
      <TrainingLapseNotice />
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
              <Notice
                kind="caution"
                text={
                  flag === 'raisedForSafePace' && paceNote !== undefined
                    ? `${targetFlagMessage(flag)} ${paceNote}`
                    : targetFlagMessage(flag)
                }
              />
            </div>
          ))}
          {breakRebound ? (
            <div className="app-stack-item">
              <Notice text={reboundText(fmt)} />
            </div>
          ) : null}
        </>
      )}
      {trainingNote === undefined ? null : (
        <div className="app-stack-item">
          <Notice text={trainingNote} />
        </div>
      )}
      {/* The goal first, under the figures and the warnings (MM-299). */}
      <MmSection
        icon="flag"
        title={`Goal: ${goalModeLabel(setup.goalMode)}`}
        trailing={<MmButton label="Change goal" kind="text" onPress={() => void changeGoal()} />}
      >
        <p className="app-text">{goalModeBlurb(setup.goalMode)}</p>
        {/* The phase, its projected end, and once it ends the next one (MM-36). */}
        {phase === undefined ? null : (
          <PhaseRows
            plan={phase}
            today={today}
            onAccept={(mode) => void applyGoal(mode)}
            onChooseAnother={() => void changeGoal()}
          />
        )}
        {/* The goal body fat (MM-507); never offered with an eating-disorder history, as MM-36 projects nothing from body fat for it. */}
        {setup.screening.eatingDisorderHistory ? null : (
          <MmListRow
            leadingIcon="percent"
            title="Goal body fat"
            subtitle={goalBodyFatSubtitle(setup.profile.sex, goalBodyFat)}
            dense
            flush
            opens
            onPress={() => void changeGoalBodyFat()}
          />
        )}
        {/* What the first month looks like, reread any time (MM-158). */}
        <MmListRow
          leadingIcon="info"
          title="What to expect"
          subtitle="The plan’s aims, what the scale does that is not progress, and when targets first move."
          dense
          flush
          opens
          onPress={() => void navigator.push(() => <WhatToExpectScreen />)}
        />
      </MmSection>
      <OneThingRow />
      {current === undefined ? null : (
        <MmSection icon="tune" title="Your targets">
          {shownTargets?.proteinMinimumG === undefined ? null : (
            <StatRow label="Protein minimum" value={Fmt.grams(shownTargets.proteinMinimumG)} />
          )}
          <StatRow
            label="Intended pace"
            value={
              current.targets.weeklyRateFraction === 0 ? 'Hold weight' : Fmt.percentPerWeek(current.targets.weeklyRateFraction)
            }
            detail={detail}
          />
          {/* The pace is the person's to choose on a cut (MM-128) and a lean gain (MM-480); recomp and maintenance have none. */}
          {setup.goalMode === 'fatLoss' && openPaceSheet !== undefined ? (
            <div className="coach-pace-row">
              <StatRow label="Pace" value={paceName(FatLossPace.of(setup.requestedLossFraction) ?? FatLossPace.default)} />
              <MmButton label="Change pace" kind="text" onPress={() => void openPaceSheet()} />
            </div>
          ) : null}
          {/* A lean gain has two paces to choose (MM-480), on the same row as the cut's. */}
          {setup.goalMode === 'leanGain' && openLeanGainPaceSheet !== undefined ? (
            <div className="coach-pace-row">
              <StatRow label="Pace" value={leanGainPaceName(setup.leanGainPace)} />
              <MmButton label="Change pace" kind="text" onPress={() => void openLeanGainPaceSheet()} />
            </div>
          ) : null}
        </MmSection>
      )}
      <LastChangeCard history={history} today={today} holdNote={holdNote(setup, snapshot, today)} />
      <MaintenanceCard />
      {recent === undefined ? null : <RecentInsightsSection insights={recent} />}
      <StallCard />
      <RecompReviewCard />
      <LeanGainCard
        onChangeGoal={() => void changeGoal()}
        onSlowerGain={openLeanGainPaceSheet === undefined ? undefined : () => void openLeanGainPaceSheet()}
      />
      <AdherenceCard />
      {/* The one-thing row above is the way into a due check-in (MM-391). */}
      <RecoveryCard answeredAbove />
      <ReportsCard />
      <MmSection icon="bolt" title="Your metabolism">
        <MetabolismSummary snapshot={snapshot} calibrating={setup.onboardedOn.daysUntil(today) < calibrationDays} />
        {gaps.includes('history') ? <DataGapNote gap="history" /> : null}
      </MmSection>
      <MmSection icon="coach" title={`Coach confidence · ${confidence}`}>
        {snapshot.confidence.level === 'learning' ? (
          <p className="app-text">Targets are held while the coach learns.</p>
        ) : null}
        <p className="app-text">{confidenceNextStepText(snapshot.confidence)}</p>
        <MmDisclosure title="The numbers behind this" remember="coach.confidence-numbers">
          <StatRow label="Estimate" value={confidenceLabel(snapshot.confidence.estimate)} />
          <StatRow label="Food log" value={confidenceLabel(snapshot.confidence.foodLog)} />
          <StatRow label="Weigh-ins" value={confidenceLabel(snapshot.confidence.weighIns)} />
          <StatRow label="Stability" value={confidenceLabel(snapshot.confidence.stability)} />
        </MmDisclosure>
      </MmSection>
      <MmSection icon="body" title="Body">
        {/* An estimate is shown with its uncertainty, in words rather than "±" (MM-108): the trend's band, as the trend
            chart draws it (two sigma). */}
        <StatRow
          label="Trend weight"
          value={fmt.weight(snapshot.trendWeightKg)}
          detail={
            trendSigma === undefined
              ? undefined
              : `Likely between ${fmt.weight(snapshot.trendWeightKg - 2 * trendSigma)} and ${fmt.weight(snapshot.trendWeightKg + 2 * trendSigma)}`
          }
        />
        {gaps.includes('weight') ? <DataGapNote gap="weight" /> : null}
        <StatRow label="Body fat" value={bodyFatRangeText(snapshot.bodyFat, snapshot.bodyFatBasis)} detail={bodyFatLine} />
        <StatRow
          label="Resting energy (BMR)"
          value={`About ${Fmt.kcal(snapshot.bmrKcal)}`}
          detail="Estimated from your sex, age, height and trend weight."
        />
      </MmSection>
    </>
  );
}
