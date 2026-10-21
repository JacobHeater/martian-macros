import { Fmt } from '../format/Fmt';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmListRow } from '../ui/MmListRow';
import { StrengthTrendCard } from '../ui/StrengthTrendCard';
import { StrengthSection } from './StrengthSection';

/** One lift's estimated strength over all its sessions, and each session it rests on. */
export function StrengthHistoryScreen({ exerciseId }: { exerciseId: string }) {
  const { state } = useApp();
  const trends = useCell(state.strengthTrends);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const trend = trends.ready ? trends.value.find((t) => t.exerciseId === exerciseId) : undefined;
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  return (
    <Screen title={trend?.name ?? 'Lift history'}>
      {!trends.ready ? (
        <StrengthSection />
      ) : trend === undefined ? (
        <InfoCard title="No sessions">
          <p className="app-text">This lift no longer has logged sessions.</p>
        </InfoCard>
      ) : (
        <>
          <StrengthTrendCard trend={trend} fmt={fmt} today={today} showFullHistory />
          <InfoCard title="Qualifying sessions">
            {trend.points.length === 0 ? <p className="app-text">No qualifying sessions yet.</p> : null}
            {[...trend.points].reverse().map((point) => (
              <MmListRow
                key={point.workoutId}
                title={Fmt.longDate(point.date)}
                subtitle={`Best set e1RM ${fmt.load(point.estimateKg)} · smoothed ${fmt.load(point.trendKg)}`}
              />
            ))}
          </InfoCard>
          <p className="app-text">
            Chart points use the latest qualifying session on each date. Every qualifying session is listed above. RIR
            not recorded counts as 0; sets above 12 effective reps and RIR 5+ are excluded.
          </p>
        </>
      )}
    </Screen>
  );
}
