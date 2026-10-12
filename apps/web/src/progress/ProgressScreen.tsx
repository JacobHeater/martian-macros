import { useState } from 'react';
import { TrendChart } from '../charts/TrendChart';
import { TrendStats } from '../charts/TrendStats';
import { CalendarDate } from '../domain/CalendarDate';
import { WaistObservation } from '../domain/WaistObservation';
import { middleReading } from '../engine/middleReading';
import { Fmt } from '../format/Fmt';
import { importedWeighInText } from '../format/importedWeighInText';
import { waistSummary } from '../format/waistSummary';
import { FormatError } from '../lang/FormatError';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { InfoCard } from '../ui/InfoCard';
import { MmSegmented } from '../ui/MmSegmented';
import { NumberEntryCard } from '../ui/NumberEntryCard';
import { RecompSignalCard } from './RecompSignalCard';
import { StrengthSection } from './StrengthSection';
import { WaistEntryCard } from './WaistEntryCard';
import { onboardingCreatine, WeightEventsCard } from './WeightEventsCard';
import './progress.css';

/** The body's record: today's weigh-in, the weight trend, weight events, the waist and strength. */
export function ProgressScreen() {
  const { services, state } = useApp();
  const [rangeDays, setRangeDays] = useState(30);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const weights = useLoaded(state.weights) ?? [];
  const waist = useLoaded(state.waist) ?? [];
  const trend = useCell(state.coach)?.trend ?? [];
  const weightEvents = useLoaded(state.weightEvents) ?? [];
  const typed = useLoaded(state.typedWeights) ?? [];
  const imported = useLoaded(state.importedWeighIns) ?? [];
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem);
  const fromOnboarding = onboardingCreatine(weightEvents, setup);
  const chartEvents = [...weightEvents, ...(fromOnboarding === undefined ? [] : [fromOnboarding])];
  const todays = [...weights].reverse().find((w) => w.date === today);
  // Today's weigh-in came from the health platform unless one was typed.
  const typedToday = typed.some((w) => w.date === today);
  const importedToday = typedToday
    ? undefined
    : [...imported].reverse().find((weighIn) => CalendarDate.fromDate(weighIn.day) === today);
  const last = trend[trend.length - 1];

  const saveWaist = (readings: readonly number[]) => {
    const cm = readings.map((value) => fmt.lengthToCm(value));
    // Refused here, so it is refused whatever stores it.
    if (cm.some((reading) => reading < WaistObservation.minCm || reading > WaistObservation.maxCm)) {
      return Promise.reject(new FormatError('Not a waist measurement.'));
    }
    return services.waist.saveWaist(today, middleReading(cm), { readings: cm });
  };

  return (
    <>
      <NumberEntryCard
        key={`weight-${todays?.weightKg}-${setup.unitSystem}`}
        title="Today’s weigh-in"
        unit={fmt.weightUnit}
        initial={todays === undefined ? undefined : toStringAsFixed(fmt.weightFromKg(todays.weightKg), 1)}
        hint={
          importedToday === undefined
            ? 'First thing in the morning, after the bathroom.'
            : `${importedWeighInText(importedToday)} Type a value to use yours instead.`
        }
        onSave={(value) => services.weights.saveWeight(today, fmt.weightToKg(value))}
      />
      <InfoCard
        title="Weight trend"
        trailing={
          <MmSegmented<number>
            name="Trend range"
            compact
            segments={[
              { value: 30, label: '30d' },
              { value: 90, label: '90d' },
            ]}
            selected={rangeDays}
            onChange={(chosen) => setRangeDays(chosen ?? rangeDays)}
          />
        }
      >
        {last === undefined ? (
          <p className="app-text">Log a weigh-in to start your trend.</p>
        ) : (
          <>
            <TrendStats trend={trend} fmt={fmt} />
            <div className="app-gap" />
            <TrendChart
              trend={trend}
              weights={weights}
              today={today}
              rangeDays={rangeDays}
              fmt={fmt}
              weightEvents={chartEvents}
              label={
                `Weight trend over the last ${rangeDays} days. Trend weight ${fmt.weight(last.levelKg)}, ` +
                `from ${weights.length} weigh-in${weights.length === 1 ? '' : 's'}.`
              }
            />
            {weights.length < 2 ? <p className="app-text">A trend needs more weigh-ins.</p> : null}
            <p className="app-caption">
              Dots are weigh-ins. The line is your trend with water swings filtered out; the band is its uncertainty.
              Daily jumps inside the band are noise, not fat. Dashed markers show recorded weight events.
            </p>
          </>
        )}
      </InfoCard>
      <WeightEventsCard />
      <WaistEntryCard
        key={`waist-${setup.unitSystem}`}
        unit={fmt.imperial ? 'inches' : 'centimeters'}
        summary={waist.length === 0 ? undefined : waistSummary(waist, fmt, today)}
        onSave={saveWaist}
      />
      <RecompSignalCard fmt={fmt} />
      <StrengthSection />
    </>
  );
}
