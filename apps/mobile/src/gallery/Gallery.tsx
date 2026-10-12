import { useState } from 'react';
import { HistoryChart } from '../charts/HistoryChart';
import { MacroSplitChart } from '../charts/MacroSplitChart';
import { MiniTrend } from '../charts/MiniTrend';
import { TrendChart } from '../charts/TrendChart';
import { TrendSparkline } from '../charts/TrendSparkline';
import { TrendStats } from '../charts/TrendStats';
import { CalendarDate } from '../domain/CalendarDate';
import { IntakeDay } from '../domain/IntakeDay';
import type { WeightTrendPoint } from '../engine/WeightTrendPoint';
import { Fmt } from '../format/Fmt';
import { HorizonArc } from '../ui/HorizonArc';
import { ChoiceCard } from '../ui/ChoiceCard';
import { DayStepper } from '../ui/DayStepper';
import { DownloadStatusStrip } from '../ui/DownloadStatusStrip';
import { GroupHeader } from '../ui/GroupHeader';
import { InfoCard } from '../ui/InfoCard';
import { MacroBar } from '../ui/MacroBar';
import { MacroFigure } from '../ui/MacroFigure';
import { MetricFacts } from '../ui/MetricFacts';
import { MmActionChip } from '../ui/MmActionChip';
import { MmCheckRow } from '../ui/MmCheckRow';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmDropdown } from '../ui/MmDropdown';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmOverlays } from '../ui/MmOverlays';
import { MmProgressBar } from '../ui/MmProgressBar';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSlider } from '../ui/MmSlider';
import { MmSpinner } from '../ui/MmSpinner';
import { MmStatusChip } from '../ui/MmStatusChip';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import { NumberEntryCard } from '../ui/NumberEntryCard';
import { SectionLabel } from '../ui/SectionLabel';
import { StatRow } from '../ui/StatRow';
import { StatusRow } from '../ui/StatusRow';
import { StepProgress } from '../ui/StepProgress';
import { MmAppBar } from '../ui/MmAppBar';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import { MmSurface } from '../ui/MmSurface';
import { destinations } from '../app/destinations';
import './gallery.css';

const COLORS = [
  'canvas', 'surface', 'raised', 'overlay', 'sunken', 'track', 'selected', 'outline', 'outline-strong',
  'text', 'text2', 'text3', 'ember', 'on-ember', 'ion', 'on-ion', 'energy', 'protein', 'carbs', 'fat',
  'positive', 'caution', 'info', 'danger', 'on-danger',
] as const;

const TYPE = ['figure-xl', 'figure', 'title', 'heading', 'body', 'label', 'caption'] as const;
const PALETTES = ['martian', 'dark', 'light'] as const;

/**
 * Every token and component as built, in each palette (MM-105). This is the
 * real thing, not a drawing of it: what is shown here is what a screen gets.
 */
export function Gallery() {
  return (
    <div className="gallery">
      {PALETTES.map((palette) => (
        <section key={palette} className={`gallery-palette theme-${palette}`} aria-label={`${palette} palette`}>
          <h2 className="gallery-title">{palette}</h2>
          <div className="gallery-swatches">
            {COLORS.map((color) => (
              <div key={color} className="gallery-swatch">
                <span style={{ background: `var(--${color})` }} />
                {color}
              </div>
            ))}
          </div>
          {TYPE.map((role) => (
            <p key={role} className="gallery-type" style={{ font: `var(--type-${role})` }}>
              {role} 1,534 kcal 184.1 lb
            </p>
          ))}
          <div className="gallery-row">
            <MmButton label="Primary" onPress={() => undefined} />
            <MmButton label="Primary off" />
            <MmButton label="Secondary" kind="secondary" onPress={() => undefined} />
            <MmButton label="Text" kind="text" onPress={() => undefined} />
            <MmIconButton icon="settings" label="Settings" onPress={() => undefined} />
          </div>
          <MmSurface>A surface</MmSurface>
          <Components />
          <Charts />
          <MmAppBar title="An app bar" />
          <MmNavigationBar destinations={destinations} current="progress" onSelect={() => undefined} />
        </section>
      ))}
    </div>
  );
}

/** One of each component, live, so a change to one is seen in all three palettes at once. */
function Components() {
  const [text, setText] = useState('Oats');
  const [on, setOn] = useState(true);
  const [unit, setUnit] = useState<string | undefined>('lb');
  const [pace, setPace] = useState(0.5);
  const nothing = () => undefined;
  return (
    <MmOverlays>
      <MmHeroSurface>
        <p style={{ margin: 0, font: 'var(--type-figure-xl)' }}>1,534</p>
        <p style={{ margin: 0, color: 'var(--text2)' }}>kcal left today</p>
      </MmHeroSurface>
      <InfoCard title="Macros" trailing={<MmStatusChip label="Partial" />}>
        <MacroBar macro="protein" grams={120} target={160} minimum={140} emphasized />
        <MacroBar macro="carbs" grams={150} target={220} />
        <MacroBar macro="fat" grams={40} target={70} />
        <div className="gallery-row" style={{ marginTop: 12 }}>
          <MacroFigure macro="protein" value="160 g" />
          <MacroFigure macro="carbs" value="220 g" />
          <MacroFigure macro="fat" value="70 g" />
        </div>
      </InfoCard>
      <MmSurface kind="compact">
        <MetricFacts
          facts={[
            ['Trend weight', '184.1 lb'],
            ['This week', '−0.8 lb'],
          ]}
        />
        <StatRow label="Days logged" value="7, all complete" />
        <StatusRow text="Calibration, day 4 of 14." onPress={nothing} />
        <MmProgressBar value={0.6} markers={[0.8, 1]} />
      </MmSurface>
      <StepProgress current={2} count={6} />
      <SectionLabel text="Your goal" />
      <ChoiceCard label="Fat loss" detail="Lose fat at a steady pace." badge="Suggested" selected onPress={nothing} />
      <ChoiceCard label="Recomp" detail="Hold weight roughly steady." selected={false} onPress={nothing} />
      <MmTextField label="Food" value={text} onChange={setText} helper="As it is on the label." />
      <MmTextField label="Weight" kind="number" suffix="lb" value="184.1" onChange={nothing} helper="That looks high." helperIsWarning />
      <MmDropdown
        label="Meal"
        value="lunch"
        items={[
          { value: 'breakfast', label: 'Breakfast' },
          { value: 'lunch', label: 'Lunch' },
        ]}
        onChange={nothing}
      />
      <MmSegmented
        name="Units"
        segments={[
          { value: 'lb', label: 'Pounds' },
          { value: 'kg', label: 'Kilograms' },
        ]}
        selected={unit}
        onChange={setUnit}
      />
      <MmSlider name="Pace" value={pace} onChange={setPace} divisions={4} />
      <div className="gallery-row">
        <MmChoiceChip label="Chosen" selected onSelect={nothing} />
        <MmChoiceChip label="Choice" selected={false} onSelect={nothing} />
        <MmActionChip label="Oats, 80 g" onPress={nothing} />
        <MmIconButton icon="plus" kind="add" label="Add" onPress={nothing} />
        <MmSpinner />
      </div>
      <GroupHeader text="Reminders" />
      <MmListGroup>
        <MmSwitchRow title="Weigh-in" subtitle="On days with no weigh-in yet." value={on} onChange={setOn} />
        <MmListRow title="Time" subtitle="7:00 AM" leadingIcon="timer" onPress={nothing} />
        <MmListRow title="Erase all data" leadingIcon="delete" danger onPress={nothing} />
      </MmListGroup>
      <MmCheckRow title="Thyroid condition" value={on} onChange={setOn} />
      <MmDisclosure title="How this was worked out" initiallyExpanded>
        <p style={{ margin: 0, color: 'var(--text2)' }}>From your last fourteen days.</p>
      </MmDisclosure>
      <Notice text="Targets hold while the app learns your metabolism." />
      <Notice kind="caution" text="Thyroid conditions affect energy needs." />
      <Notice
        kind="safeguard"
        title="Talk to your care team first"
        text="Insulin treatment can cause low blood sugar when you eat less."
        action={<MmButton label="I have" kind="secondary" onPress={nothing} />}
      />
      <NumberEntryCard title="Today's weigh-in" unit="lb" initial="184.1" hint="First thing in the morning." onSave={async () => undefined} />
      <DayStepper label="Yesterday" onPrevious={nothing} onNext={nothing} onLabelPress={nothing} />
      <DownloadStatusStrip label="Downloading foods" fraction={0.4} onCancel={nothing} />
    </MmOverlays>
  );
}

const chartDay = CalendarDate.of(2026, 10, 10);
const chartTrend = Array.from({ length: 30 }, (_, i) => ({
  date: chartDay.addDays(i - 29),
  levelKg: 84 - i * 0.05 + Math.sin(i / 4) * 0.2,
  levelSigmaKg: 0.25 + (i % 7) * 0.02,
})) as unknown as WeightTrendPoint[];

/** The charts, drawn from invented figures. */
function Charts() {
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
    </>
  );
}
