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
import { MmGradeBadge } from '../ui/MmGradeBadge';
import { MmHeroSurface } from '../ui/MmHeroSurface';
import { MmNutrientRow } from '../ui/MmNutrientRow';
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
import { MmBusyLine } from '../ui/MmBusyLine';
import { MmQrCode } from '../ui/MmQrCode';
import { MmPullToRefresh } from '../ui/MmPullToRefresh';
import { MmStatusChip } from '../ui/MmStatusChip';
import { MmSurface } from '../ui/MmSurface';
import { MmSwipeToRemove } from '../ui/MmSwipeToRemove';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { MmTextField } from '../ui/MmTextField';
import { Notice } from '../ui/Notice';
import { NumberEntry } from '../ui/NumberEntry';
import { ReadFailedNotice } from '../ui/ReadFailedNotice';
import { ScreenLoading } from '../ui/ScreenLoading';
import { WaistProtocolFigure } from '../ui/WaistProtocolFigure';
import { MeasurementSiteFigure } from '../ui/MeasurementSiteFigure';
import { MmCameraPreview } from '../ui/MmCameraPreview';
import { MmPhoto } from '../ui/MmPhoto';
import { fixturePhotoJpeg } from '../fixtures/fixturePhotoJpeg';
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
      {/* MM-370: a grade, and the question mark of one that can't be given. */}
      <div className="gallery-row">
        <MmGradeBadge letter="B+" label="Grade B plus" />
        <MmGradeBadge letter="D-" label="Grade D minus" />
        <MmGradeBadge letter={undefined} label="No grade for Soup. Why?" onExplain={() => undefined} />
      </div>
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
      <InfoCard title="Micros">
        <MmNutrientRow
          name="Iron"
          figures="9 mg"
          note="Reference 18 mg"
          amount={9}
          reference={18}
          sources={[
            { name: 'Lentils', figures: '7 mg' },
            { name: 'Spinach', figures: '2 mg' },
          ]}
        />
        <MmNutrientRow name="Potassium" figures="1,200 mg" note="from 4 of 7 foods · reference 2,600 mg" amount={1200} reference={2600} />
        <MmNutrientRow name="Vitamin C" figures="140 mg" note="Reference 75 mg" amount={140} reference={75} />
        <MmNutrientRow name="Vitamin B12" figures="No data yet" />
        <MmNutrientRow name="Saturated fat" figures="14 g" />
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
        <MmProgressBar kind="water" value={0.19} />
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
      {/* With icons: an unchosen segment shows its icon, the chosen one its check (MM-321). */}
      <MmSegmented
        name="Units, with icons"
        segments={[
          { value: 'lb', label: 'Pounds', icon: 'scale' },
          { value: 'kg', label: 'Kilograms', icon: 'scale' },
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
      {/* A wait in a line of text (MM-673), and the pull-to-refresh strip let go past its threshold (MM-670). */}
      <MmBusyLine label="The coach is writing…" />
      <MmPullToRefresh pull={{ phase: 'ready', distance: 72 }} />
      {/* A move code (MM-698): dark on light in every palette, the app's icon in the middle. */}
      <MmQrCode text="MMMOVE1:YCUAAGF4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" label="QR code for your other phone to scan" />
      <MmSection icon="calendar" title="Weight events" summary="2 this month" trailing={<MmIconButton icon="plus" kind="add" label="Add a weight event" onPress={nothing} />}>
        <MmListRow title="Travel" subtitle="Yesterday · Scale noise widened around this event." leadingIcon="travel" />
      </MmSection>
      <MmSection
        icon="food"
        title="Dinner"
        summary="584 kcal · P 37 · C 74 · F 15"
        foldBesideTitle
        collapsible
        initiallyExpanded={false}
        trailing={<MmIconButton icon="plus" kind="add" label="Add food to dinner" onPress={nothing} />}
      >
        <p style={{ margin: 0, color: 'var(--text2)' }}>The fold's arrow beside the title, the summary up to the actions.</p>
      </MmSection>
      <MmSection icon="tape" title="Waist" summary="Latest: 34.2 in on Oct 5." collapsible initiallyExpanded={false}>
        <p style={{ margin: 0, color: 'var(--text2)' }}>Three fields and Save, once opened.</p>
      </MmSection>
      {/* How to measure the waist, drawn (MM-155): shown for the first three measurements and from "How to measure" after. */}
      <div className="gallery-row">
        <WaistProtocolFigure />
      </div>
      {/* Every other site, drawn where the tape sits (MM-156). */}
      <div className="gallery-row">
        {(['neck', 'chest', 'hips', 'upperArm', 'thigh', 'calf'] as const).map((site) => (
          <MeasurementSiteFigure key={site} site={site} />
        ))}
      </div>
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
      <ReadFailedNotice title="Could not read your weigh-ins" onRetry={nothing} />
      <ScreenLoading />
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
      {/* MM-157: a progress photo, small and whole, and the camera's frame with the last photo laid over it. */}
      <div className="app-row">
        <MmPhoto jpeg={fixturePhotoJpeg} label="Front photo, October 5, 2026" thumbnail />
        <MmPhoto jpeg={undefined} label="A photo being read" thumbnail />
      </div>
      <MmCameraPreview attach={undefined} overlay={fixturePhotoJpeg} />
    </MmOverlays>
  );
}
