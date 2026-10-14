import { ChoiceCard } from '../ui/ChoiceCard';
import { DayStepper } from '../ui/DayStepper';
import { DownloadStatusStrip } from '../ui/DownloadStatusStrip';
import { GroupHeader } from '../ui/GroupHeader';
import { InfoCard } from '../ui/InfoCard';
import { MacroBar } from '../ui/MacroBar';
import { MacroFigure } from '../ui/MacroFigure';
import { MetricFacts } from '../ui/MetricFacts';
import { DemoNotice } from '../ui/DemoNotice';
import { MmActionChip } from '../ui/MmActionChip';
import { MmButton } from '../ui/MmButton';
import { MmCheckRow } from '../ui/MmCheckRow';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmDisclosure } from '../ui/MmDisclosure';
import { MmDropdown } from '../ui/MmDropdown';
import { MmFab } from '../ui/MmFab';
import { MmFooterActions } from '../ui/MmFooterActions';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmOverlays } from '../ui/MmOverlays';
import { MmPressable } from '../ui/MmPressable';
import { MmProgressBar } from '../ui/MmProgressBar';
import { MmRhythmStrip } from '../ui/MmRhythmStrip';
import { MmSection } from '../ui/MmSection';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSlider } from '../ui/MmSlider';
import { MmSpinner } from '../ui/MmSpinner';
import { MmStatusChip } from '../ui/MmStatusChip';
import { MmSurface } from '../ui/MmSurface';
import { MmSwipeToRemove } from '../ui/MmSwipeToRemove';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import { NumberEntry } from '../ui/NumberEntry';
import { SectionLabel } from '../ui/SectionLabel';
import { StatRow } from '../ui/StatRow';
import { StepProgress } from '../ui/StepProgress';
import { useState } from 'react';
import './gallery.css';

export function ComponentsCatalog() {
  const [text, setText] = useState('Oats');
  const [on, setOn] = useState(true);
  const [unit, setUnit] = useState<string | undefined>('lb');
  const [pace, setPace] = useState(0.5);
  const nothing = () => undefined;
  return (
    <MmOverlays>
      <div className="gallery-row">
        <MmButton label="Primary" onPress={() => undefined} />
        <MmButton label="Primary off" />
        <MmButton label="Secondary" kind="secondary" onPress={() => undefined} />
        <MmButton label="Text" kind="text" onPress={() => undefined} />
        <MmIconButton icon="settings" label="Settings" onPress={() => undefined} />
      </div>
      <MmSurface>A surface</MmSurface>
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
        <MmListRow title="Calibration, day 4 of 14." leadingIcon="info" dense flush opens onPress={nothing} />
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
      <MmSlider name="Pace" value={pace} onChange={setPace} divisions={4} label={`${pace}% a week`} />
      <div className="gallery-row">
        <MmChoiceChip label="Chosen" selected onSelect={nothing} />
        <MmChoiceChip label="Choice" selected={false} onSelect={nothing} />
        <MmActionChip label="Oats, 80 g" onPress={nothing} />
        <MmIconButton icon="plus" kind="add" label="Add" onPress={nothing} />
        <MmSpinner />
      </div>
      <MmSection icon="calendar" title="Weight events" summary="2 this month" trailing={<MmIconButton icon="plus" kind="add" label="Add a weight event" onPress={nothing} />}>
        <MmListRow title="Travel" subtitle="Yesterday · Scale noise widened around this event." leadingIcon="travel" />
      </MmSection>
      <MmSection icon="tape" title="Waist" summary="Latest: 34.2 in on Oct 5." collapsible initiallyExpanded={false}>
        <p style={{ margin: 0, color: 'var(--text2)' }}>Three fields and Save, once opened.</p>
      </MmSection>
      <MmRhythmStrip
        name="Last seven days"
        days={['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'].map((letter, i) => ({
          key: letter,
          letter,
          label: `${letter}: ${i % 3 === 0 ? 'logged and marked complete' : i % 3 === 1 ? 'partly logged' : 'nothing logged'}`,
          mark: i % 3 === 0 ? 'full' : i % 3 === 1 ? 'half' : 'none',
          today: i === 6,
        }))}
        onSelect={nothing}
      />
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
      <MmSurface kind="compact">
        <MmPressable label="Open today's detail" onPress={nothing}>
          <p style={{ margin: 0, font: 'var(--type-figure-xl)' }}>1,534</p>
          <p style={{ margin: 0, color: 'var(--text2)' }}>Pressable content: the button draws nothing.</p>
        </MmPressable>
      </MmSurface>
      <Notice text="Targets hold while the app learns your metabolism." />
      <Notice kind="caution" text="Thyroid conditions affect energy needs." />
      <Notice
        kind="safeguard"
        title="Talk to your care team first"
        text="Insulin treatment can cause low blood sugar when you eat less."
        action={<MmButton label="I have" kind="secondary" onPress={nothing} />}
      />
      <NumberEntry title="Today's weigh-in" unit="lb" initial="184.1" hint="First thing in the morning." onSave={async () => undefined} />
      <DayStepper label="Yesterday" onPrevious={nothing} onNext={nothing} onLabelPress={nothing} />
      <MmSurface kind="compact" padded={false}>
        <MmSwipeToRemove onRemove={nothing}>
          <MmListRow title="Oats, 80 g" subtitle="Drag left to remove" />
        </MmSwipeToRemove>
      </MmSurface>
      <DownloadStatusStrip label="Downloading foods" fraction={0.4} onCancel={nothing} />
      <MmFooterActions>
        <MmButton label="Save" expand onPress={nothing} />
      </MmFooterActions>
      <DemoNotice>
        <p style={{ margin: 0, color: 'var(--text2)' }}>What every screen of a seeded demo build carries above it.</p>
      </DemoNotice>
      <div className="app-fab-anchor">
        <MmFab label="Add food" icon="plus" onPress={nothing} />
      </div>
    </MmOverlays>
  );
}
