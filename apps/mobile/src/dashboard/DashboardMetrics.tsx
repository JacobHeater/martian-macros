import { usePaceInWords } from '../coach/usePaceInWords';
import { HistoryChart } from '../charts/HistoryChart';
import type { HistorySeries } from '../charts/HistorySeries';
import { TrendChart } from '../charts/TrendChart';
import { RecoveryCard } from '../coach/RecoveryCard';
import type { CalendarDate } from '../domain/CalendarDate';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { confidenceLabel } from '../format/confidenceLabel';
import { confidenceNextStepText } from '../format/confidenceNextStepText';
import { Fmt } from '../format/Fmt';
import { waistAmount } from '../format/waistAmount';
import type { HomeDestination } from '../state/HomeDestination';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSegmented } from '../ui/MmSegmented';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { StatRow } from '../ui/StatRow';
import { DashboardHistory } from './DashboardHistory';

interface DashboardMetricsProps {
  /**
   * Whether the Dashboard could not read the pauses, or is reading them
   * again after it could not: the history is drawn without targets or
   * coverage, and the Dashboard's own notice is the one alert and the one
   * retry (MM-183, MM-334).
   */
  pausesUnchecked?: boolean;
}

/**
 * The history under the Dashboard: what was recorded over 7 or 30 days, as
 * sections of the Dashboard's hierarchy, each a summary line and its chart
 * (MM-335). Today, still being logged, is drawn apart and kept out of the
 * averages.
 */
export function DashboardMetrics({ pausesUnchecked = false }: DashboardMetricsProps) {
  const { state } = useApp();
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
  const setup = Loadable.valueOf(useCell(state.setup));
  const today = useCell(state.today);
  const days = useCell(state.dashboardRange);
  const intake = useCell(state.intakeDays);
  const weights = useCell(state.weights);
  const waist = useCell(state.waist);
  const history = useCell(state.targetsHistory);
  const pauses = useCell(state.pauses);
  const recovery = useCell(state.recoveryCheckIns);
  // Each day's target line is the day's own under a shaped week (MM-124); flat until the shapes are read.
  const shapes = Loadable.valueOf(useCell(state.targetShapes)) ?? [];
  const shapeLimits = useCell(state.targetShapeLimits);
  const snapshot = useCell(state.coach);
  const paceInWords = usePaceInWords();
  if (setup === undefined) return null;
  // Pauses that cannot be read take out only what they decide: targets and coverage (MM-183, MM-334).
  const unchecked = pausesUnchecked || Loadable.hasFailed(pauses);
  if ([intake, weights, waist, history, recovery].some((source) => Loadable.hasFailed(source))) {
    return <ReadFailedNotice title="Could not read your history" onRetry={() => state.retryHistory()} />;
  }
  if (!intake.ready || !weights.ready || !waist.ready || !history.ready || (!pauses.ready && !unchecked) || !recovery.ready) {
    return <ScreenLoading />;
  }
  const knownPauses = unchecked ? [] : (Loadable.valueOf(pauses) ?? []);
  const allowed =
    snapshot?.policy.targetsAllowed ??
    CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }).targetsAllowed;
  const facts = new DashboardHistory({
    today,
    days,
    intake: intake.value,
    history: history.value,
    pauses: knownPauses,
    weights: weights.value,
    onboardedOn: setup.onboardedOn,
    targetsAllowed: allowed && !unchecked,
    shapes,
    limits: shapeLimits,
  });
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
  const waists = waist.value.filter((w) => !w.date.isBefore(facts.start) && !w.date.isAfter(today));
  const latestWaist = waists[waists.length - 1];
  const estimates = new Map<CalendarDate, number>();
  for (const record of history.value) {
    if (record.tdeeStatus === 'updated') estimates.set(record.effectiveFrom, record.tdeeKcal);
  }
  const open = (tab: HomeDestination) => () => state.homeTab.put(tab);
  const chart = (series: readonly HistorySeries[], unit: string) => (
    <HistoryChart series={series} today={today} days={days} unit={unit} />
  );
  const trend = (snapshot?.trend ?? []).filter((point) => !point.date.isBefore(facts.start) && !point.date.isAfter(today));
  const firstTrend = trend[0];
  const lastTrend = trend[trend.length - 1];
  const weighIns = weights.value.filter((w) => !w.date.isBefore(facts.start) && !w.date.isAfter(today)).length;
  const firstWaist = waists[0];
  const coached = snapshot !== undefined && allowed;
  const sofar = facts.unfinished === undefined ? undefined : facts.calories.get(facts.unfinished);
  const sofarProtein = facts.unfinished === undefined ? undefined : facts.protein.get(facts.unfinished);
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const signed = (text: string, value: number) => (text.startsWith('0 ') ? text : `${value < 0 ? '−' : '+'}${text}`);

  // A summary says what the chosen days add, never a figure the rows above already give (MM-335).
  // Every average says how many logged days it uses, the days the Logging row counts: paused days are left out (MM-176).
  const onlyPaused = 'Only paused days logged in these days';
  let intakeSummary = 'Nothing logged in these days yet';
  if (facts.meanCalories !== undefined) {
    intakeSummary = `${Fmt.kcal(facts.meanCalories)} a day on average, across ${plural(facts.finishedDays, 'logged day', 'logged days')}`;
  } else if (sofar !== undefined) intakeSummary = `Today so far: ${Fmt.kcal(sofar)} · counts once marked complete`;
  else if (facts.pausedDays > 0) intakeSummary = onlyPaused;
  let proteinSummary = 'No protein logged in these days yet';
  if (facts.meanProtein !== undefined) {
    proteinSummary = `${Fmt.grams(facts.meanProtein)} a day on average, across ${plural(facts.proteinDays, 'logged day', 'logged days')}`;
  } else if (sofarProtein !== undefined) proteinSummary = `Today so far: ${Fmt.grams(sofarProtein)}`;
  else if (facts.pausedDays > 0) proteinSummary = onlyPaused;
  // A chart is drawn once a day is finished, or a paused day was logged.
  const charted = facts.finishedDays + facts.pausedDays > 0;
  let weightSummary = 'No weigh-ins in these days yet';
  if (firstTrend !== undefined && lastTrend !== undefined && trend.length > 1 && weighIns > 1) {
    // With the weight hidden (MM-118), the pace in words against the plan's.
    weightSummary = fmt.weightHidden
      ? (paceInWords ?? 'Weighed in; the trend is still being worked out')
      : `${fmt.weightDelta(lastTrend.levelKg - firstTrend.levelKg)} since ${Fmt.shortDay(firstTrend.date)}`;
  } else if (weighIns > 0) weightSummary = 'One weigh-in so far: the trend needs two';
  let waistSummary = 'Not measured in these days';
  if (firstWaist !== undefined && latestWaist !== undefined && waists.length > 1) {
    const change = latestWaist.waistCm - firstWaist.waistCm;
    waistSummary = `${signed(waistAmount(change, fmt), change)} since ${Fmt.shortDay(firstWaist.date)}`;
  } else if (latestWaist !== undefined) waistSummary = 'Measured once in these days';
  const loggingSummary = unchecked
    ? 'Paused days could not be checked'
    : facts.activeDays === 1
      ? facts.loggedDays === 1
        ? 'Food logged today'
        : 'No food logged yet today'
      : `${facts.loggedDays} of ${facts.activeDays} days with food logged`;

  // Sections of the Dashboard's own hierarchy (MM-335): no headline of their own, no cards; each opens its home.
  return (
    <>
      <MmListGroup>
        <MmListRow
          leadingIcon="calendar"
          title="Days shown"
          trailingAction={
            <MmSegmented<number>
              name="History range"
              compact
              segments={[
                { value: 7, label: '7 days' },
                { value: 30, label: '30 days' },
              ]}
              selected={days}
              onChange={(chosen) => {
                if (chosen !== undefined) state.dashboardRange.put(chosen);
              }}
            />
          }
        />
      </MmListGroup>
      <MmSection icon="food" title="Intake" summary={intakeSummary} onPress={open('food')} opens="Opens Food">
        {/* Nothing finished: the summary says so, with no near-empty grid under it. */}
        {!charted ? null : (
          <>
            {chart(
              [
                { label: 'Logged intake', values: facts.calories, kind: 'energy', unfinished: facts.unfinished },
                { label: 'Target in force', values: facts.calorieTargets, kind: 'target', dashed: true },
              ],
              'kcal',
            )}
            <p className="app-caption">
              Missing days are gaps, not zero intake. Today counts in the average once it is marked complete.
              {unchecked
                ? ' Paused days could not be checked, so targets are not shown.'
                : knownPauses.some((p) => !p.to.isBefore(facts.start) && !p.from.isAfter(today))
                  ? ' Paused days are shown; targets, coverage and the averages leave them out.'
                  : ''}
            </p>
          </>
        )}
      </MmSection>
      <MmSection icon="protein" title="Protein" summary={proteinSummary} onPress={open('food')} opens="Opens Food">
        {!charted
          ? null
          : chart(
              [
                { label: 'Logged protein', values: facts.protein, kind: 'protein', unfinished: facts.unfinished },
                { label: 'Minimum / target', values: facts.proteinTargets, kind: 'target', dashed: true },
              ],
              'g',
            )}
      </MmSection>
      <MmSection icon="scale" title="Weight trend" summary={weightSummary} onPress={open('progress')} opens="Opens Progress">
        {/* No chart with the weight hidden; with the trend only, the line and band without the dots (MM-118). */}
        {weighIns < 2 || fmt.weightHidden ? null : (
          <>
            <TrendChart
              trend={snapshot?.trend ?? []}
              weights={fmt.readingsShown ? weights.value : []}
              today={today}
              rangeDays={days}
              fmt={fmt}
              label={
                fmt.readingsShown
                  ? `Weight trend in ${fmt.weightUnit}, ${days} days, with observations and uncertainty band.`
                  : `Weight trend in ${fmt.weightUnit}, ${days} days, with its uncertainty band.`
              }
            />
            <p className="app-caption">
              {fmt.readingsShown
                ? 'Dots are weigh-ins; the line is the trend. The band shows its uncertainty.'
                : 'The line is the trend. The band shows its uncertainty.'}
            </p>
          </>
        )}
      </MmSection>
      <MmSection icon="tape" title="Waist" summary={waistSummary} onPress={open('progress')} opens="Opens Progress">
        {waists.length < 2
          ? null
          : chart(
              [
                {
                  label: 'Recorded waist',
                  values: new Map(waists.map((w) => [w.date, fmt.lengthFromCm(w.waistCm)])),
                  kind: 'measurement',
                  connectRecordedPoints: true,
                },
              ],
              fmt.lengthUnit,
            )}
      </MmSection>
      <MmSection icon="checklist" title="Logging" summary={loggingSummary}>
        {unchecked ? (
          <p className="app-caption">Coverage leaves paused days out, so it is shown once they can be read.</p>
        ) : (
          <>
            <StatRow label="Days marked complete" value={`${facts.completeDays} of ${facts.activeDays}`} />
            <StatRow label="Days weighed in" value={`${facts.weighInDays} of ${facts.activeDays}`} />
            <p className="app-caption">What was recorded, not a score. Paused days and days before you started are left out.</p>
          </>
        )}
      </MmSection>
      <MmSection
        icon="coach"
        title="Coach and expenditure"
        summary={
          coached
            ? `Confidence: ${confidenceLabel(snapshot.confidence.level)}`
            : // Why there is none, never a bare "No estimate yet" (MM-176).
              allowed
              ? 'Needs two weeks of logs and weigh-ins'
              : 'Targets are off for your profile'
        }
        onPress={open('coach')}
        opens="Opens Coach"
      >
        {coached ? (
          <>
            <StatRow
              label={snapshot.tdee.status === 'updated' ? 'Measured expenditure' : 'Starting or held estimate'}
              value={
                `${Fmt.whole(snapshot.tdee.kcal - snapshot.tdee.sigmaKcal)}–` +
                `${Fmt.whole(snapshot.tdee.kcal + snapshot.tdee.sigmaKcal)} kcal`
              }
            />
            <StatRow label="Food log evidence" value={confidenceLabel(snapshot.confidence.foodLog)} />
            <StatRow label="Weight evidence" value={confidenceLabel(snapshot.confidence.weighIns)} />
            <p className="app-caption">{confidenceNextStepText(snapshot.confidence)}</p>
            {estimates.size === 0
              ? null
              : chart(
                  [
                    {
                      label: 'Measured estimates at check-ins',
                      values: estimates,
                      kind: 'estimate',
                      connectRecordedPoints: true,
                    },
                  ],
                  'kcal/day',
                )}
          </>
        ) : null}
      </MmSection>
      {/* Its own section says what its answers are; nothing of it sits outside it, folded or not (MM-353). */}
      <RecoveryCard />
    </>
  );
}
