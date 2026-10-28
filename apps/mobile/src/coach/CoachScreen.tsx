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
import { goalBodyFatCheckText } from '../format/goalBodyFatCheckText';
import { goalBodyFatSubtitle } from '../format/goalBodyFatSubtitle';
import { quantityText } from '../format/quantityText';
import { recalculationWithheldText } from '../format/recalculationWithheldText';
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
import { CalorieHero } from '../food/CalorieHero';
import { PauseBanner } from '../pause/PauseBanner';
import { ProgressScreen } from '../progress/ProgressScreen';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmButton } from '../ui/MmButton';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { Notice } from '../ui/Notice';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { StatRow } from '../ui/StatRow';
import { useOverlays } from '../ui/useOverlays';
import { AdherenceCard } from './AdherenceCard';
import { DataGapNote } from './DataGapNote';
import { ExecutiveSummaryCard } from './ExecutiveSummaryCard';
import { GoalBodyFatSheet } from './GoalBodyFatSheet';
import { HeadsUpSection } from './HeadsUpSection';
import { dataGapsOf } from './dataGapsOf';
import { LastChangeCard } from './LastChangeCard';
import { LeanGainCard } from './LeanGainCard';
import { MaintenanceCard } from './MaintenanceCard';
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
import { WhatYourDataSaysSection } from './WhatYourDataSaysSection';
import { useLeanGainPaceSheet } from './useLeanGainPaceSheet';
import { usePaceInWords } from './usePaceInWords';
import { usePaceSheet } from './usePaceSheet';
import { useCheckInNow } from './useCheckInNow';
import './coach.css';

const more = (count: number, what: string) => `${count} more ${what}${count === 1 ? '' : 's'}`;

/** The pace in weight, worded as approximate until the coach is sure; none with the weight hidden (MM-118). */
function paceDetail(snapshot: CoachSnapshot, rate: number, fmt: Fmt): string | undefined {
  if (rate === 0 || fmt.weightHidden) return undefined;
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
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const paceInWords = usePaceInWords();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const openPaceSheet = usePaceSheet();
  const openLeanGainPaceSheet = useLeanGainPaceSheet();
  // Targets worked out again now from the latest weigh-in (MM-559).
  const checkInNow = useCheckInNow();
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

  if (setup === undefined) return null;
  if (!weights.ready && !Loadable.hasFailed(weights)) return <ScreenLoading />;
  if (snapshot === undefined) {
    return (
      <>
        {weights.ready && weights.value.length > 0 && sources.some((source) => Loadable.hasFailed(source)) ? (
          <ReadFailedNotice title="Could not read what your coach works from" onRetry={() => state.retryCoach()} />
        ) : null}
        <ProgressScreen />
      </>
    );
  }
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });

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
      overlays.snack(`The plan’s own goal, ${PhaseRule.cutGoalPercent(sex)}%, is back.`);
      return;
    }
    if (SafetyBounds.checkGoalBodyFat(sex, answer) === 'rejected') return;
    await services.goalBodyFat.saveGoalBodyFat({ percent: answer, setOn: today });
    // Under the soft floor the snack restates the limit the sheet said (MM-507).
    overlays.snack(
      SafetyBounds.checkGoalBodyFat(sex, answer) === 'warnAndTimeLimit'
        ? `Goal body fat set to ${quantityText(answer)}%, held ${PhaseRule.lowGoalHoldWeeks} weeks at most once reached.`
        : `Goal body fat set to ${quantityText(answer)}%.`,
    );
  };

  const detail = current === undefined ? undefined : paceDetail(snapshot, current.targets.weeklyRateFraction, fmt);
  // A diet break brings the water back as leaving a cut does (MM-130): said under the break's notice while it does (MM-135, the panel's UX-5).
  const runningBreak = breakInForce(history, today);
  const breakRebound = runningBreak !== undefined && runningBreak.startedOn.daysUntil(today) < MaintenanceRule.reboundNoteDays;
  // Rounded as every screen shows them, unless the person asked for exact ones (MM-123).
  const shownTargets = current === undefined ? undefined : displayTargets(current.targets, { exact: exactTargets });
  const confidence = confidenceLabel(snapshot.confidence.level);
  const bodyFatLine = bodyFatNote(snapshot.bodyFatBasis, { eatingDisorderHistory: setup.screening.eatingDisorderHistory });
  // On a weight-loss medication (MM-113, MM-510): the fast pace is for the prescriber, and training keeps muscle.
  const paceNote = current === undefined ? undefined : weightLossMedicationPaceNote(setup.screening, current.targets.flags);
  const trainingNote = weightLossMedicationTrainingNote(setup.screening, setup.trainingDaysPerWeek);
  // The goal body fat row (MM-507): only in fat loss and recomp, and never with an eating-disorder history.
  const goalBodyFatOffered =
    !setup.screening.eatingDisorderHistory && (setup.goalMode === 'fatLoss' || setup.goalMode === 'recomp');
  const goalBodyFatWarning =
    goalBodyFat === undefined ? undefined : goalBodyFatCheckText(setup.profile.sex, goalBodyFat.percent);
  // What the health platform's gaps cost, each beside the estimate it weakens (MM-523).
  const gaps = dataGapsOf({
    connection,
    confidence: snapshot.confidence,
    eatingDisorderHistory: setup.screening.eatingDisorderHistory,
  });
  // The body fold's line (MM-676): the trend, or the pace in words with the weight hidden, or the ask to weigh in.
  const lastTrend = snapshot.trend[snapshot.trend.length - 1];
  const bodySummary = fmt.weightHidden
    ? (paceInWords ?? 'Weigh in daily; measure once a week.')
    : lastTrend === undefined
      ? 'Not weighed yet. Once a day is enough.'
      : `Trend ${fmt.weight(lastTrend.levelKg)}`;
  const headsUp = [
    ...[...snapshot.policy.cautions].map(cautionMessage),
    ...(current === undefined
      ? []
      : [...current.targets.flags].map((flag) =>
          flag === 'raisedForSafePace' && paceNote !== undefined ? `${targetFlagMessage(flag)} ${paceNote}` : targetFlagMessage(flag),
        )),
  ];
  return (
    <>
      {/* The safeguards above the hero, in this order; the cautions and target flags are the Heads up section under it (MM-553). */}
      <PauseBanner />
      <UnderEatingNotice />
      <TrainingLapseNotice />
      <ReliefOfferCard />
      {/* The one calorie visual (MM-187): today against the targets in force, or the guide during a pause. */}
      {current === undefined ? null : (
        <CalorieHero
          intake={intakeDayFrom(today, food)}
          entries={food}
          targets={pause !== undefined ? guide : current.targets}
          paused={pause !== undefined}
          status={`Next check-in ${Fmt.day(nextCheckIn(setup, current), today)}`}
          confidence={confidence}
          onStatusPress={() => void navigator.push(() => <TargetsHistoryScreen />)}
        />
      )}
      {/* The summary card, then the goal (the owner's order, MM-676). */}
      <ExecutiveSummaryCard />
      <MmSection
        icon="flag"
        title="Goal"
        summary={goalModeLabel(setup.goalMode)}
        collapsible
        initiallyExpanded={false}
        remember="coach.goal"
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
        {/*
          The goal body fat (MM-507): offered only while losing fat (fat loss or recomp), where a cut runs to it;
          never with an eating-disorder history, as MM-36 projects nothing from body fat for it.
          Its subtitle stays short; a soft-floor warning is a caution notice under it.
        */}
        {!goalBodyFatOffered ? null : (
          <>
            <MmListRow
              leadingIcon="percent"
              title="Goal body fat"
              subtitle={goalBodyFatSubtitle(setup.profile.sex, goalBodyFat)}
              dense
              flush
              opens
              onPress={() => void changeGoalBodyFat()}
            />
            {goalBodyFatWarning === undefined ? null : (
              <div className="app-stack-item">
                <Notice kind="caution" text={goalBodyFatWarning} />
              </div>
            )}
          </>
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
        {/* Inside the fold, with what it changes (the owner, MM-676). */}
        <MmButton label="Change goal" kind="text" onPress={() => void changeGoal()} />
      </MmSection>
      {/* The one thing to do, under the goal (MM-299). */}
      <OneThingRow />
      {/* What the coach reads in the log (MM-610), then the body: the weigh-in, the trend and the measurements, one
          fold with their own sections inside, as Dashboard's History holds its charts (MM-583, MM-676). */}
      <WhatYourDataSaysSection />
      <MmSection
        icon="scale"
        title="Body measurements and weigh-in"
        summary={bodySummary}
        flush
        collapsible
        initiallyExpanded={false}
        remember="coach.body-measurements"
      >
        <ProgressScreen />
      </MmSection>
      {current === undefined ? null : (
        <MmSection
          icon="tune"
          title="Your targets"
          summary={shownTargets === undefined ? undefined : `${Fmt.kcal(shownTargets.kcal)} · ${Fmt.grams(shownTargets.proteinG)} protein`}
          collapsible
          initiallyExpanded={false}
          remember="coach.targets"
        >
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
          {/*
            A check-in the person starts, from the latest weigh-in, rather than wait for the weekly one (MM-559). Off, with what keeps it
            off in an info notice under it, without a weigh-in from the last week (and during a pause or a break).
          */}
          {checkInNow === undefined ? null : (
            <div className="coach-check-in-now">
              <MmButton
                label="Check in now"
                kind="secondary"
                icon="sync"
                expand
                onPress={checkInNow.withheld === undefined ? () => void checkInNow.checkIn() : undefined}
                describedBy="coach-check-in-now-note"
              />
              {checkInNow.withheld === undefined ? (
                <p id="coach-check-in-now-note" className="app-caption">
                  Works your targets out now from your latest weigh-in, instead of waiting for the weekly check-in.
                </p>
              ) : (
                <div id="coach-check-in-now-note">
                  <Notice text={recalculationWithheldText(checkInNow.withheld)} />
                </div>
              )}
            </div>
          )}
        </MmSection>
      )}
      {/* The health check's cautions, then the target flags: one section folded to its count (MM-553), after the targets they are about (MM-676). */}
      <HeadsUpSection notes={headsUp} />
      {current !== undefined && breakRebound ? (
        <div className="app-stack-item">
          <Notice text={reboundText(fmt)} />
        </div>
      ) : null}
      {trainingNote === undefined ? null : (
        <div className="app-stack-item">
          <Notice text={trainingNote} />
        </div>
      )}
      <LastChangeCard history={history} today={today} holdNote={holdNote(setup, snapshot, today)} />
      <MaintenanceCard />
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
      <MmSection icon="bolt" title="Your metabolism" summary={`About ${Fmt.kcal(snapshot.tdee.kcal)} a day`} collapsible initiallyExpanded={false} remember="coach.metabolism-section">
        <MetabolismSummary snapshot={snapshot} calibrating={setup.onboardedOn.daysUntil(today) < calibrationDays} />
        {gaps.includes('history') ? <DataGapNote gap="history" /> : null}
      </MmSection>
      <MmSection icon="coach" title={`Coach confidence · ${confidence}`} collapsible initiallyExpanded={false} remember="coach.confidence">
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
      <MmSection icon="body" title="Body" summary={bodyFatRangeText(snapshot.bodyFat, snapshot.bodyFatBasis)} collapsible initiallyExpanded={false} remember="coach.body">
        {fmt.weightHidden && paceInWords !== undefined ? (
          <StatRow label="Your trend" value={paceInWords} detail="Against your plan’s pace" />
        ) : null}
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
