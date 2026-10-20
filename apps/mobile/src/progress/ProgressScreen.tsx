import { useState } from 'react';
import { TrendChart } from '../charts/TrendChart';
import { TrendStats } from '../charts/TrendStats';
import { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { importedWeighInText } from '../format/importedWeighInText';
import { waistSummary } from '../format/waistSummary';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSpinner } from '../ui/MmSpinner';
import { NumberEntry } from '../ui/NumberEntry';
import { RecompSignalCard } from './RecompSignalCard';
import { StrengthSection } from './StrengthSection';
import { WaistEntryCard } from './WaistEntryCard';
import { onboardingCreatine } from './onboardingCreatine';
import { saveWaistReadings } from './saveWaistReadings';
import { WeightEventsCard } from './WeightEventsCard';
import { PeriodDaysCard } from './PeriodDaysCard';
import { cycleWindows } from '../engine/cycleWindows';
import './progress.css';

/**
 * The body's record, in tiers (MM-257): the hero holds today's weigh-in
 * and the trend with its chart; weight events, the waist and strength are
 * sections beneath, the last two folded to a line until opened.
 */
export function ProgressScreen() {
  const { services, state } = useApp();
  const [rangeDays, setRangeDays] = useState(30);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const weights = useLoaded(state.weights) ?? [];
  const waist = useLoaded(state.waist) ?? [];
  const trend = useCell(state.coach)?.trend ?? [];
  const weightEvents = useLoaded(state.weightEvents) ?? [];
  const flowDays = useLoaded(state.flowDays) ?? [];
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

  const saveWaist = (readings: readonly number[]) =>
    saveWaistReadings(
      services.waist,
      today,
      readings.map((value) => fmt.lengthToCm(value)),
    );

  return (
    <>
      <MmHeroSurface>
        <h2 className="progress-hero-title">Today’s weigh-in</h2>
        <NumberEntry
          key={`weight-${todays?.weightKg}-${setup.unitSystem}`}
          title="Today’s weigh-in"
          unit={fmt.weightUnit}
          initial={todays === undefined ? undefined : toStringAsFixed(fmt.weightFromKg(todays.weightKg), 1)}
          hint={
            importedToday === undefined
              ? 'First thing in the morning, after the bathroom.'
              : `${importedWeighInText(importedToday, services.platform)} Type a value to use yours instead.`
          }
          onSave={(value) => services.weights.saveWeight(today, fmt.weightToKg(value))}
        />
        <div className="progress-hero-trend">
          <div className="progress-hero-head">
            <h2 className="progress-hero-title">Weight trend</h2>
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
          </div>
          {last === undefined && weights.length > 0 ? (
            // Weighed, and the trend still being worked out (MM-343).
            <MmSpinner />
          ) : last === undefined ? (
            <p className="app-text">No trend yet.</p>
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
                cycleWindows={cycleWindows(flowDays)}
                label={
                  `Weight trend over the last ${rangeDays} days. Trend weight ${fmt.weight(last.levelKg)}, ` +
                  `from ${weights.length} weigh-in${weights.length === 1 ? '' : 's'}.`
                }
              />
              {weights.length < 2 ? <p className="app-text">A trend needs more weigh-ins.</p> : null}
              {/* The one line about uncertainty stays in view; the rest is one tap down (UX-5, PD-19). */}
              <p className="app-caption">The band is the trend’s uncertainty; day-to-day jumps inside it are noise, not fat.</p>
              <MmDisclosure title="How to read this">
                <p className="app-caption">
                  Dots are weigh-ins. The line is your trend with water swings filtered out. Dashed markers show
                  recorded weight events. A shaded stretch is the days around a period start, where the band is wider
                  on purpose.
                </p>
              </MmDisclosure>
            </>
          )}
        </div>
      </MmHeroSurface>
      <WeightEventsCard />
      <PeriodDaysCard />
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
