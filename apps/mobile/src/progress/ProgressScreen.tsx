import { usePaceInWords } from '../coach/usePaceInWords';
import { useEffect, useRef, useState } from 'react';
import { ChartPlaceholder } from '../charts/ChartPlaceholder';
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
import { MmSurface } from '../ui/MmSurface';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSpinner } from '../ui/MmSpinner';
import { NumberEntry } from '../ui/NumberEntry';
import { MeasurementsCard } from './MeasurementsCard';
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
import { ProgressPhotosCard } from './ProgressPhotosCard';
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
  // How much of the person's weight is shown (MM-118).
  const weightDisplay = useCell(state.weightDisplay);
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
  const paceInWords = usePaceInWords();
  if (setup === undefined) return null;
  const fmt = new Fmt(setup.unitSystem, { weightDisplay });
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
      {/* On its surface inside the body fold (MM-676), as the waist chart is: a field never sits bare (MM-291). */}
      <MmSurface>
        <h2 className="progress-hero-title">Today’s weigh-in</h2>
        {/* Unless every reading is shown, today's is not put back in the field: what was typed is seen, and nothing after (MM-118). */}
        <NumberEntry
          key={fmt.readingsShown ? `weight-${todays?.weightKg}-${setup.unitSystem}` : `weight-${todays === undefined ? 'none' : todays.weightKg}`}
          title="Today’s weigh-in"
          unit={fmt.weightUnit}
          saveKind="secondary"
          initial={todays === undefined || !fmt.readingsShown ? undefined : toStringAsFixed(fmt.weightFromKg(todays.weightKg), 1)}
          hint={
            !fmt.readingsShown && todays !== undefined
              ? 'Saved. Type a value to replace it.'
              : importedToday === undefined
                ? 'First thing in the morning, after the bathroom.'
                : fmt.readingsShown
                  ? `${importedWeighInText(importedToday, services.platform)} Type a value to use yours instead.`
                  : 'Today’s weigh-in came from your scale. Type a value to use yours instead.'
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
            // Nothing to draw: the chart's frame says what starts it (MM-578), and that the coach starts from the first weigh-in (MM-340).
            <>
              <p className="app-caption">The coach starts from your first weigh-in.</p>
              <ChartPlaceholder tall text="No trend yet. Your first weigh-in starts it." />
            </>
          ) : fmt.weightHidden ? (
            // No figure and no chart with the weight hidden: the pace in words against the plan's (MM-118).
            <>
              <p className="app-subhead">{paceInWords ?? 'Your trend is being worked out.'}</p>
              <p className="app-caption">
                Against your plan’s pace. Your weight is hidden; the coach still uses every weigh-in. You can change this in
                Settings.
              </p>
            </>
          ) : (
            <>
              <TrendStats trend={trend} fmt={fmt} />
              <div className="app-gap" />
              <TrendChart
                trend={trend}
                // With the trend only, the line and band without the weigh-ins' dots (MM-118).
                weights={fmt.readingsShown ? weights : []}
                today={today}
                rangeDays={rangeDays}
                fmt={fmt}
                weightEvents={chartEvents}
                cycleWindows={cycleWindows(flowDays)}
                label={
                  `Weight trend over the last ${rangeDays} days. Trend weight ${fmt.weight(last.levelKg)}, ` +
                  `from ${weights.length} weigh-in${weights.length === 1 ? '' : 's'}.`
                }
                pickedDay={fmt.readingsShown ? pickedDay : undefined}
                onPickDay={fmt.readingsShown ? setPickedDay : undefined}
              />
              {weights.length < 2 ? <p className="app-text">A trend needs more weigh-ins.</p> : null}
              {/* The one line about uncertainty stays in view, with its chart; the rest is one tap down (UX-5, PD-19). */}
              <p className="app-caption">The band is the trend’s uncertainty; day-to-day jumps inside it are noise, not fat.</p>
              {/* The reading under the chart (MM-142): the one picked, or the latest when it is far from the trend. A region
                  that is always there, so a reading picked with the keyboard is announced (the panel's UX-3). */}
              <div aria-live="polite">
                {fmt.readingsShown && noteWeighIn !== undefined && (pickedDay !== undefined || jump !== undefined) ? (
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
                  {fmt.readingsShown
                    ? 'Dots are weigh-ins. The line is your trend with water swings filtered out. Dashed markers show ' +
                      'recorded weight events. A shaded stretch is the days around a period start, where the band is wider ' +
                      'on purpose. Tap a dot, or move with the arrow keys, to see that weigh-in.'
                    : 'The line is your trend with water swings filtered out; single weigh-ins are not shown. Dashed ' +
                      'markers show recorded weight events. A shaded stretch is the days around a period start, where the ' +
                      'band is wider on purpose.'}
                </p>
              </MmDisclosure>
            </>
          )}
        </div>
      </MmSurface>
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
            latestWaist === undefined ? (
              // Before the first measurement, the chart's place says what it will show (MM-578).
              <MmSurface>
                <div className="progress-waist-chart">
                  <h3 className="progress-waist-chart-title">Waist over time</h3>
                  <ChartPlaceholder
                    tall
                    text="No measurements yet. Each one is a dot here; the line through them starts from the third."
                    count={{ done: 0, of: 3, unit: 'measurements' }}
                  />
                </div>
              </MmSurface>
            ) : (
              <MmSurface>
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
              </MmSurface>
            )
          }
          onSave={saveWaist}
        />
      </div>
      <MeasurementsCard fmt={fmt} />
      <RecompSignalCard fmt={fmt} />
      <StrengthSection />
      <ProgressPhotosCard />
    </>
  );
}
