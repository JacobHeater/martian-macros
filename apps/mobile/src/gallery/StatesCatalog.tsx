import { type ReactNode, useState } from 'react';
import { CalendarDate } from '../domain/CalendarDate';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MmActionChip } from '../ui/MmActionChip';
import { MmButton } from '../ui/MmButton';
import { MmCalendarDay } from '../ui/MmCalendarDay';
import { MmCheckRow } from '../ui/MmCheckRow';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmDrum } from '../ui/MmDrum';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmMenuItemRow } from '../ui/MmMenuItemRow';
import { MmOption } from '../ui/MmOption';
import { MmPickerField } from '../ui/MmPickerField';
import { MmSegmented } from '../ui/MmSegmented';
import { MmSlider } from '../ui/MmSlider';
import { MmStatusChip } from '../ui/MmStatusChip';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { MmTextField } from '../ui/MmTextField';
import './gallery.css';

/** One state of one control, named. `pressed` wraps it in the class the stylesheet shares with `:active`. */
function State({ name, pressed = false, wide = false, children }: { name: string; pressed?: boolean; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`gallery-state${wide ? ' gallery-state-wide' : ''}`}>
      <span className="gallery-state-name">{name}</span>
      {pressed ? <span className="mm-pressed">{children}</span> : children}
    </div>
  );
}

const nothing = () => undefined;
const day = CalendarDate.of(1996, 1, 15);

/**
 * Every control at rest, pressed, disabled, selected and in error, so a
 * state can be looked at on its own in three palettes (MM-273). Focus is a
 * play step of the story.
 */
export function StatesCatalog() {
  const [on, setOn] = useState(true);
  const [pace, setPace] = useState(0.5);
  const [hour, setHour] = useState(6);
  return (
    <div className="gallery-states">
      <div className="gallery-state-row">
        <State name="Primary"><MmButton label="Save" onPress={nothing} /></State>
        <State name="Pressed" pressed><MmButton label="Save" onPress={nothing} /></State>
        <State name="Disabled"><MmButton label="Save" /></State>
        <State name="Secondary"><MmButton label="Cancel" kind="secondary" onPress={nothing} /></State>
        <State name="Pressed" pressed><MmButton label="Cancel" kind="secondary" onPress={nothing} /></State>
        <State name="Text"><MmButton label="Skip" kind="text" onPress={nothing} /></State>
        <State name="Destructive"><MmButton label="Erase" kind="destructive" onPress={nothing} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Icon"><MmIconButton icon="settings" label="Settings" onPress={nothing} /></State>
        <State name="Pressed" pressed><MmIconButton icon="settings" label="Settings" onPress={nothing} /></State>
        <State name="Disabled"><MmIconButton icon="settings" label="Settings" onPress={undefined} /></State>
        <State name="Add"><MmIconButton icon="plus" kind="add" label="Add" onPress={nothing} /></State>
        <State name="Pressed" pressed><MmIconButton icon="plus" kind="add" label="Add" onPress={nothing} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Field" wide><MmTextField label="Weight" suffix="lb" value="184.1" onChange={nothing} helper="This morning." /></State>
        <State name="Error" wide><MmTextField label="Weight" suffix="lb" value="5" onChange={nothing} error="That value looks off." /></State>
        <State name="Picker" wide><MmPickerField label="Date of birth" valueText="January 15, 1996" onPress={nothing} /></State>
        <State name="Pressed" wide pressed><MmPickerField label="Date of birth" valueText="January 15, 1996" onPress={nothing} /></State>
        <State name="Disabled" wide><MmPickerField label="Event" valueText="Illness" onPress={undefined} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Switch on" wide><MmSwitchRow title="Weigh-in reminder" value={on} onChange={setOn} /></State>
        <State name="Switch off" wide><MmSwitchRow title="Weigh-in reminder" value={!on} onChange={(v) => setOn(!v)} /></State>
        <State name="Pressed" wide pressed><MmSwitchRow title="Weigh-in reminder" value={on} onChange={setOn} /></State>
        <State name="Checked"><MmCheckRow title="Thyroid condition" value onChange={nothing} /></State>
        <State name="Unchecked"><MmCheckRow title="Thyroid condition" value={false} onChange={nothing} /></State>
        <State name="Pressed" pressed><MmCheckRow title="Thyroid condition" value={false} onChange={nothing} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Slider" wide><MmSlider name="Pace" value={pace} divisions={4} label={`${pace}% a week`} onChange={setPace} /></State>
        <State name="Pressed" wide pressed><MmSlider name="Pace" value={0.25} divisions={4} label="0.25% a week" onChange={nothing} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Segmented">
          <MmSegmented name="Units" segments={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} selected="lb" onChange={nothing} />
        </State>
        <State name="Compact">
          <MmSegmented name="Range" compact segments={[{ value: 30, label: '30 d' }, { value: 90, label: '90 d' }]} selected={30} onChange={nothing} />
        </State>
        <State name="Pressed" pressed>
          <MmSegmented name="Units" segments={[{ value: 'lb', label: 'Pounds' }, { value: 'kg', label: 'Kilograms' }]} selected="kg" onChange={nothing} />
        </State>
      </div>
      <div className="gallery-state-row">
        <State name="Chip"><MmChoiceChip label="Chest" selected={false} onSelect={nothing} /></State>
        <State name="Selected"><MmChoiceChip label="Chest" selected onSelect={nothing} /></State>
        <State name="Pressed" pressed><MmChoiceChip label="Chest" selected={false} onSelect={nothing} /></State>
        <State name="Action"><MmActionChip label="Oats, 80 g" onPress={nothing} /></State>
        <State name="Status"><MmStatusChip label="Partial" /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Card" wide><ChoiceCard label="Fat loss" detail="Lose fat at a steady pace." selected={false} onPress={nothing} /></State>
        <State name="Selected" wide><ChoiceCard label="Fat loss" detail="Lose fat at a steady pace." badge="Suggested" selected onPress={nothing} /></State>
        <State name="Pressed" wide pressed><ChoiceCard label="Recomp" selected={false} onPress={nothing} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Rows" wide>
          <MmListGroup>
            <MmListRow title="Opens" subtitle="With the row's own chevron" leadingIcon="timer" opens onPress={nothing} />
            <span className="mm-pressed">
              <MmListRow title="Pressed" leadingIcon="info" opens onPress={nothing} />
            </span>
            <MmListRow title="Erase all data" leadingIcon="delete" danger onPress={nothing} />
          </MmListGroup>
        </State>
      </div>
      <div className="gallery-state-row">
        <State name="Option"><MmOption label="Lunch" chosen={false} onSelect={nothing} /></State>
        <State name="Chosen"><MmOption label="Lunch" chosen onSelect={nothing} /></State>
        <State name="Pressed" pressed><MmOption label="Lunch" chosen={false} onSelect={nothing} /></State>
        <State name="Menu item"><MmMenuItemRow label="Copy to today" onSelect={nothing} /></State>
        <State name="Pressed" pressed><MmMenuItemRow label="Delete" onSelect={nothing} /></State>
      </div>
      <div className="gallery-state-row">
        <State name="Day"><MmCalendarDay date={day} chosen={false} today={false} outside={false} focusable={false} onSelect={nothing} /></State>
        <State name="Chosen"><MmCalendarDay date={day} chosen today={false} outside={false} focusable onSelect={nothing} /></State>
        <State name="Today"><MmCalendarDay date={day} chosen={false} today outside={false} focusable={false} onSelect={nothing} /></State>
        <State name="Outside"><MmCalendarDay date={day} chosen={false} today={false} outside focusable={false} onSelect={nothing} /></State>
        <State name="Pressed" pressed><MmCalendarDay date={day} chosen={false} today={false} outside={false} focusable={false} onSelect={nothing} /></State>
        <State name="Drum">
          <div className="mm-drums">
            <span className="mm-drums-band" aria-hidden="true" />
            <MmDrum name="Hour" options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} value={hour} onChange={setHour} />
          </div>
        </State>
      </div>
    </div>
  );
}
