import { useEffect, useRef, useState } from 'react';
import { TrendChart } from '../charts/TrendChart';
import { WaistChart } from '../charts/WaistChart';
import { TrendStats } from '../charts/TrendStats';
import { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { importedWeighInText } from '../format/importedWeighInText';
import { waistAmount } from '../format/waistAmount';
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
import { SleepNightCard } from './SleepNightCard';
import { StrengthSection } from './StrengthSection';
import { useWeightJump } from './useWeightJump';
import { WaistEntryCard } from './WaistEntryCard';
import { WeighInNote } from './WeighInNote';
import { onboardingCreatine } from './onboardingCreatine';
import { saveWaistReadings } from './saveWaistReadings';
import { WeightEventsCard } from './WeightEventsCard';
import { PeriodDaysCard } from './PeriodDaysCard';
import { cycleWindows } from '../engine/cycleWindows';
import './progress.css';

/**
 * The body's record, in tiers (MM-257): the hero holds today's weigh-in
 * and the trend with its chart; weight events, sleep (MM-250), the waist and
 * strength are sections beneath, the last two folded to a line until opened. The range
 * and the folds are kept across visits (MM-286), and the waist's
 * confirmation on the Dashboard opens the screen at its Waist section
 * (MM-304).
 */
export function ProgressScreen() {
  const { services, state } = useApp();
  const rangeDays = useCell(state.progressRangeDays);
  const reveal = useCell(state.progressReveal);
  const waistSection = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reveal !== 'waist') return;
    const section = waistSection.current;
    // In view and in hand: the section's header takes focus, so a reader goes on from it (UX-6, PD-6).
    section?.scrollIntoView?.({ block: 'start' });
    section?.querySelector<HTMLElement>('.mm-section-heading button')?.focus();
    state.progressReveal.put(undefined);
  }, [reveal, state]);
  // The weigh-in the person tapped on the chart (MM-142); the latest in range until they do.
  const [pickedDay, setPickedDay] = useState<CalendarDate | undefined>(undefined);
  // The waist chart's span (MM-155): a weekly measure needs 90 days or a year, never 30.
  const [waistRangeDays, setWaistRangeDays] = useState(90);
  const setup = useLoaded(state.setup);
  const today = useCell(state.today);
  const weights = useLoaded(state.weights) ?? [];
  const waist = useLoaded(state.waist) ?? [];
  const trend = useCell(state.coach)?.trend ?? [];
  const weightEvents = useLoaded(state.weightEvents) ?? [];
  const flowDays = useLoaded(state.flowDays) ?? [];
  const typed = useLoaded(state.typedWeights) ?? [];
  const imported = useLoaded(state.importedWeighIns) ?? [];
  const inRange = weights.filter((w) => !w.date.isBefore(today.addDays(1 - rangeDays)) && !w.date.isAfter(today));
  const noteDay = pickedDay ?? inRange[inRange.length - 1]?.date;
  const noteWeighIn = weights.find((w) => w.date === noteDay);
  const jump = useWeightJump(noteDay);
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
  const todaysWaist = waist.find((observation) => observation.date === today);
  const latestWaist = [...waist].sort((a, b) => a.date.compareTo(b.date))[waist.length - 1];

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
              onChange={(chosen) => {
                state.progressRangeDays.put(chosen ?? rangeDays);
                setPickedDay(undefined);
              }}
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
                pickedDay={pickedDay}
                onPickDay={setPickedDay}
              />
              {weights.length < 2 ? <p className="app-text">A trend needs more weigh-ins.</p> : null}
              {/* The one line about uncertainty stays in view, with its chart; the rest is one tap down (UX-5, PD-19). */}
              <p className="app-caption">The band is the trend’s uncertainty; day-to-day jumps inside it are noise, not fat.</p>
              {/* The reading under the chart (MM-142): the one picked, or the latest when it is far from the trend. A region
                  that is always there, so a reading picked with the keyboard is announced (the panel's UX-3). */}
              <div aria-live="polite">
                {noteWeighIn !== undefined && (pickedDay !== undefined || jump !== undefined) ? (
                  <WeighInNote
                    weighIn={noteWeighIn}
                    trendKg={trend.find((p) => p.date === noteWeighIn.date)?.levelKg}
                    explanation={jump}
                    picked={pickedDay !== undefined}
                    fmt={fmt}
                    today={today}
                  />
                ) : null}
              </div>
              <MmDisclosure title="How to read this" remember="progress.how-to-read">
                <p className="app-caption">
                  Dots are weigh-ins. The line is your trend with water swings filtered out. Dashed markers show
                  recorded weight events. A shaded stretch is the days around a period start, where the band is wider
                  on purpose. Tap a dot, or move with the arrow keys, to see that weigh-in.
                </p>
              </MmDisclosure>
            </>
          )}
        </div>
      </MmHeroSurface>
      <WeightEventsCard />
      <PeriodDaysCard />
      <SleepNightCard />
      <div ref={waistSection} className="progress-waist">
        <WaistEntryCard
          key={`waist-${setup.unitSystem}`}
          unit={fmt.imperial ? 'inches' : 'centimeters'}
          summary={waist.length === 0 ? undefined : waistSummary(waist, fmt, today)}
          entries={waist.length}
          recordedToday={todaysWaist === undefined ? undefined : waistAmount(todaysWaist.waistCm, fmt)}
          chart={
            latestWaist === undefined ? undefined : (
              <div className="progress-waist-chart">
                <div className="progress-hero-head">
                  <h3 className="progress-waist-chart-title">Waist over time</h3>
                  <MmSegmented<number>
                    name="Waist range"
                    compact
                    segments={[
                      { value: 90, label: '90d' },
                      { value: 365, label: '1y' },
                    ]}
                    selected={waistRangeDays}
                    onChange={(chosen) => setWaistRangeDays(chosen ?? waistRangeDays)}
                  />
                </div>
                <WaistChart
                  waist={waist}
                  today={today}
                  rangeDays={waistRangeDays}
                  fmt={fmt}
                  label={
                    `Waist over the last ${waistRangeDays === 365 ? 'year' : `${waistRangeDays} days`}. ` +
                    `Latest ${waistAmount(latestWaist.waistCm, fmt)}, from ${waist.length} measurement${waist.length === 1 ? '' : 's'}.`
                  }
                />
                <p className="app-caption">
                  {waist.length < 3
                    ? 'Dots are measurements. From the third, a line through the middle of each three, and a band of what a tape can tell apart.'
                    : 'Dots are measurements. The line is the middle of each three; the band is what a tape can tell apart.'}
                </p>
              </div>
            )
          }
          onSave={saveWaist}
        />
      </div>
      <RecompSignalCard fmt={fmt} />
      <StrengthSection />
    </>
  );
}
