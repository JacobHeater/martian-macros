import { Fmt } from '../format/Fmt';
import { MonthlyReportText } from '../format/MonthlyReportText';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { StatRow } from '../ui/StatRow';
import { RecompReviewBody } from './RecompReviewBody';

/**
 * One monthly report (MM-33): what the user did, what the body did, what
 * the coach measured and every change to the targets with its reason.
 * `index` zero is the first 28 days.
 */
export function MonthlyReportScreen({ index }: { index: number }) {
  const { state } = useApp();
  const report = useCell(state.monthlyReport(index));
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  if (report === undefined || setup === undefined) {
    return (
      <Screen title="Monthly report">
        <p className="app-text">This report is not ready yet.</p>
      </Screen>
    );
  }
  const fmt = new Fmt(setup.unitSystem);
  const words = new MonthlyReportText(report, fmt, today);
  const rows = (pairs: readonly (readonly [string, string])[]) =>
    pairs.map(([label, value]) => <StatRow key={label} label={label} value={value} />);
  const review = report.recompReview;
  const lifts = words.lifts;
  const changes = words.targetChanges;
  return (
    <Screen title={words.title}>
      <InfoCard title="What you did">{rows(words.work)}</InfoCard>
      <InfoCard title="What your body did">{rows(words.body)}</InfoCard>
      {review === undefined ? null : (
        <InfoCard title={`Recomp review, week ${review.week}`}>
          <RecompReviewBody review={review} fmt={fmt} />
        </InfoCard>
      )}
      {lifts.length === 0 ? null : (
        <InfoCard title="Your lifts">
          {rows(lifts)}
          <p className="app-caption">
            Estimated one-rep max, smoothed over recent sessions, at the first and the last session of the month. It is
            worked out from reps and load, not tested.
          </p>
        </InfoCard>
      )}
      <InfoCard title="What the coach measured">
        <p className="app-text">{words.estimate}</p>
      </InfoCard>
      <InfoCard title="Changes to your targets">
        {changes.length === 0 ? (
          <p className="app-text app-muted">Your targets did not change this month.</p>
        ) : (
          changes.map((line) => (
            <p key={line} className="app-text">
              {line}
            </p>
          ))
        )}
      </InfoCard>
    </Screen>
  );
}
