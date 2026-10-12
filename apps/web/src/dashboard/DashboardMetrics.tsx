import { HistoryChart } from '../charts/HistoryChart';
import type { HistorySeries } from '../charts/HistorySeries';
import { TrendChart } from '../charts/TrendChart';
import { RecoveryCard } from '../coach/RecoveryCard';
import type { CalendarDate } from '../domain/CalendarDate';
import { CoachingPolicy } from '../domain/CoachingPolicy';
import { confidenceLabel } from '../format/confidenceLabel';
import { confidenceNextStepText } from '../format/confidenceNextStepText';
import { Fmt } from '../format/Fmt';
import type { HomeDestination } from '../state/HomeDestination';
import { Loadable } from '../state/Loadable';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { InfoCard } from '../ui/InfoCard';
import { MetricFacts } from '../ui/MetricFacts';
import { MmButton } from '../ui/MmButton';
import { MmSegmented } from '../ui/MmSegmented';
import { Notice } from '../ui/Notice';
import { DashboardHistory } from './DashboardHistory';

/** The history under the Dashboard: what was recorded over 7 or 30 days, as facts and charts. */
export function DashboardMetrics() {
  const { state } = useApp();
  const setup = Loadable.valueOf(useCell(state.setup));
  const today = useCell(state.today);
  const days = useCell(state.dashboardRange);
  const intake = useCell(state.intakeDays);
  const weights = useCell(state.weights);
  const waist = useCell(state.waist);
  const history = useCell(state.targetsHistory);
  const pauses = useCell(state.pauses);
  const recovery = useCell(state.recoveryCheckIns);
  const snapshot = useCell(state.coach);
  if (setup === undefined) return null;
  if ([intake, weights, waist, history, pauses, recovery].some((source) => Loadable.hasFailed(source))) {
    return <Notice kind="caution" text="Dashboard history could not be loaded. Reopen the app to retry." />;
  }
  if (!intake.ready || !weights.ready || !waist.ready || !history.ready || !pauses.ready || !recovery.ready) {
    return (
      <InfoCard title="Your history">
        <p className="app-text">Loading your recorded metrics…</p>
      </InfoCard>
    );
  }
  const allowed =
    snapshot?.policy.targetsAllowed ??
    CoachingPolicy.derive({ profile: setup.profile, screening: setup.screening, today }).targetsAllowed;
  const facts = new DashboardHistory({
    today,
    days,
    intake: intake.value,
    history: history.value,
    pauses: pauses.value,
    weights: weights.value,
    onboardedOn: setup.onboardedOn,
    targetsAllowed: allowed,
  });
  const fmt = new Fmt(setup.unitSystem);
  const waists = waist.value.filter((w) => !w.date.isBefore(facts.start) && !w.date.isAfter(today));
  const latestWaist = waists[waists.length - 1];
  const estimates = new Map<CalendarDate, number>();
  for (const record of history.value) {
    if (record.tdeeStatus === 'updated') estimates.set(record.effectiveFrom, record.tdeeKcal);
  }
  const detail = (label: string, tab: HomeDestination) => (
    <MmButton label={label} kind="text" onPress={() => state.homeTab.put(tab)} />
  );
  const chart = (series: readonly HistorySeries[], unit: string) => (
    <HistoryChart series={series} today={today} days={days} unit={unit} />
  );
  const shownRecovery = recovery.value;
  const firstShown = shownRecovery[shownRecovery.length > 8 ? shownRecovery.length - 8 : 0];
  const lastShown = shownRecovery[shownRecovery.length - 1];
  return (
    <>
      {facts.calories.size === 0 ? <p className="app-text">Log food to populate your intake history.</p> : null}
      <div className="dashboard-metrics-head">
        <h2 className="app-headline">Your metrics</h2>
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
      </div>
      <InfoCard title="Nutrition history" trailing={detail('Food details', 'food')}>
        <MetricFacts
          facts={[
            ['Average logged intake', facts.meanCalories === undefined ? 'Not recorded' : Fmt.kcal(facts.meanCalories)],
            ['Days with intake records', `${facts.calories.size} / ${days}`],
          ]}
        />
        {chart(
          [
            { label: 'Logged intake', values: facts.calories, kind: 'energy' },
            { label: 'Target in force', values: facts.calorieTargets, kind: 'target', dashed: true },
          ],
          'kcal',
        )}
        <p className="app-text">
          Missing logs are gaps, not zero intake. Averages use recorded days, including today’s unfinished log.
        </p>
        {pauses.value.some((p) => !p.to.isBefore(facts.start) && !p.from.isAfter(today)) ? (
          <p className="app-text">
            Paused days remain visible as observations; targets and coverage counts exclude them.
          </p>
        ) : null}
      </InfoCard>
      <InfoCard title="Protein history">
        <MetricFacts
          facts={[
            ['Average logged protein', facts.meanProtein === undefined ? 'Not recorded' : Fmt.grams(facts.meanProtein)],
            ['Recorded days used', `${facts.protein.size}`],
          ]}
        />
        {chart(
          [
            { label: 'Logged protein', values: facts.protein, kind: 'protein' },
            { label: 'Minimum / target', values: facts.proteinTargets, kind: 'target', dashed: true },
          ],
          'g',
        )}
        {facts.protein.size === 0 ? (
          <p className="app-text">Log protein-containing food to populate this history.</p>
        ) : null}
      </InfoCard>
      <InfoCard title="Weight trend & uncertainty" trailing={detail('Progress', 'progress')}>
        <TrendChart
          trend={snapshot?.trend ?? []}
          weights={weights.value}
          today={today}
          rangeDays={days}
          fmt={fmt}
          label={`Weight trend in ${fmt.weightUnit}, ${days} days, with observations and uncertainty band.`}
        />
        <p className="app-text">
          {fmt.weightUnit} · Dots are measurements; the line is the estimated trend. The band shows uncertainty.
        </p>
      </InfoCard>
      <InfoCard title="Waist history">
        <MetricFacts
          facts={[
            ['Latest in range', latestWaist === undefined ? 'Not recorded' : fmt.length(latestWaist.waistCm)],
            ['Measurements', `${waists.length}`],
          ]}
        />
        {chart(
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
        {waists.length === 0 ? <p className="app-text">Add waist measurements in Progress to see history.</p> : null}
      </InfoCard>
      <InfoCard title="Logging coverage">
        <MetricFacts
          facts={[
            ['Food days recorded', `${facts.loggedDays} / ${facts.activeDays}`],
            ['Days marked complete', `${facts.completeDays} / ${facts.activeDays}`],
            ['Weigh-in days', `${facts.weighInDays} / ${facts.activeDays}`],
            ['Window', `${days} days`],
          ]}
        />
        <p className="app-text">
          Counts describe available records, not a score. Paused days and days before onboarding are excluded.
        </p>
      </InfoCard>
      <InfoCard title="Coach & expenditure" trailing={detail('Coach details', 'coach')}>
        {snapshot === undefined || !allowed ? (
          <p className="app-text">No coaching estimate available.</p>
        ) : (
          <>
            <MetricFacts
              facts={[
                ['Coach confidence', confidenceLabel(snapshot.confidence.level)],
                [
                  snapshot.tdee.status === 'updated' ? 'Measured expenditure range' : 'Starting / held estimate range',
                  `${Fmt.whole(snapshot.tdee.kcal - snapshot.tdee.sigmaKcal)}–` +
                    `${Fmt.whole(snapshot.tdee.kcal + snapshot.tdee.sigmaKcal)} kcal`,
                ],
                ['Food log evidence', confidenceLabel(snapshot.confidence.foodLog)],
                ['Weight evidence', confidenceLabel(snapshot.confidence.weighIns)],
              ]}
            />
            <p className="app-text">{confidenceNextStepText(snapshot.confidence)}</p>
            {chart(
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
            <p className="app-text">Check-in estimates are not daily expenditure measurements.</p>
          </>
        )}
      </InfoCard>
      <RecoveryCard />
      {firstShown === undefined || lastShown === undefined ? null : (
        <p className="app-text dashboard-recovery-note">
          Recovery observations: {Fmt.shortDay(firstShown.date)}–{Fmt.shortDay(lastShown.date)}. Each line is a separate
          answer, not a combined score.
        </p>
      )}
    </>
  );
}
