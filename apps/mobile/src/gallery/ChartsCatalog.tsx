import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { HistoryChart } from '../charts/HistoryChart';
import { HorizonArc } from '../ui/HorizonArc';
import { InfoCard } from '../ui/InfoCard';
import { IntakeDay } from '../domain/IntakeDay';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import { MiniTrend } from '../charts/MiniTrend';
import { MmSurface } from '../ui/MmSurface';
import { MuscleVolume } from '../engine/MuscleVolume';
import { MuscleVolumeRow } from '../ui/MuscleVolumeRow';
import { StrengthTrend } from '../engine/StrengthTrend';
import { StrengthTrendCard } from '../ui/StrengthTrendCard';
import { Exercise } from '../domain/training/Exercise';
import { TrendChart } from '../charts/TrendChart';
import { TrendSparkline } from '../charts/TrendSparkline';
import { TrendStats } from '../charts/TrendStats';
import './gallery.css';

const chartDay = CalendarDate.of(2026, 10, 10);
const chartTrend = Array.from({ length: 30 }, (_, i) => ({
  date: chartDay.addDays(i - 29),
  levelKg: 84 - i * 0.05 + Math.sin(i / 4) * 0.2,
  levelSigmaKg: 0.25 + (i % 7) * 0.02,
})) as unknown as WeightTrendPoint[];

/** The charts, drawn from invented figures. */
export function ChartsCatalog() {
  const fmt = new Fmt('metric');
  const valuesOf = (value: (daysAgo: number) => number | undefined) =>
    new Map(
      Array.from({ length: 30 }, (_, daysAgo) => [chartDay.addDays(-daysAgo), value(daysAgo)] as const).filter(
        (entry): entry is readonly [CalendarDate, number] => entry[1] !== undefined,
      ),
    );
  return (
    <>
      <MmSurface>
        <HorizonArc progress={0.62} label="1,300 of 2,100 kcal" />
        <HorizonArc progress={1.2} label="Over target" />
      </MmSurface>
      <InfoCard title="Nutrition history">
        <HistoryChart
          today={chartDay}
          days={30}
          unit="kcal"
          series={[
            { label: 'Logged intake', kind: 'energy', values: valuesOf((d) => (d % 6 === 2 ? undefined : 2000 + ((d * 37) % 300))) },
            { label: 'Target in force', kind: 'target', dashed: true, values: valuesOf((d) => (d > 14 ? 2300 : 2250)) },
          ]}
        />
      </InfoCard>
      <InfoCard title="Weight">
        <TrendStats trend={chartTrend} fmt={fmt} />
        <TrendSparkline trend={chartTrend} />
        <TrendChart
          label="Weight trend"
          trend={chartTrend}
          weights={chartTrend.filter((_, i) => i % 2 === 0).map((p, i) => ({ date: p.date, weightKg: p.levelKg + ((i % 3) - 1) * 0.4 }))}
          weightEvents={[{ date: chartDay.addDays(-9), type: 'travel' }]}
          today={chartDay}
          rangeDays={30}
          fmt={fmt}
        />
      </InfoCard>
      <InfoCard title="Macronutrient split">
        <MacroSplitChart intake={new IntakeDay({ date: chartDay, kcal: 1450, proteinG: 100, carbsG: 150, fatG: 50 })} />
      </InfoCard>
      <MmSurface kind="compact">
        <MiniTrend values={[3, 4, 2, 4, 5]} min={1} max={5} slots={8} label="Hunger" />
      </MmSurface>
      <StrengthTrendCard
        trend={
          new StrengthTrend({
            exerciseId: 'back-squat',
            exercise: new Exercise({ id: 'back-squat', name: 'Back squat', equipment: 'barbell', primary: 'chest' }),
            points: [0, 7, 14, 21, 28].map((daysAgo, at) => ({
              workoutId: at + 1,
              date: chartDay.addDays(-28 + daysAgo),
              estimateKg: 120 + at * 2.5,
              trendKg: 119 + at * 2.2,
            })),
            loggedSessions: 5,
            recentSessions: 3,
          })
        }
        fmt={fmt}
        today={chartDay}
        onHistory={() => undefined}
      />
      <InfoCard title="Weekly training volume">
        <MuscleVolumeRow volume={new MuscleVolume({ group: 'chest', currentSets: 12, previousSets: 9 })} />
      </InfoCard>
    </>
  );
}
