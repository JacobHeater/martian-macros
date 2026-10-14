import { useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { WeightEventType } from '../domain/WeightEventType';
import { Fmt } from '../format/Fmt';
import { weightEventLabel } from '../format/weightEventLabel';
import { useApp } from '../app/useApp';
import { MmButton } from '../ui/MmButton';
import { MmDropdown } from '../ui/MmDropdown';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

/** Notes something that moves the scale without being fat or muscle, on a day in the last four weeks. */
export function WeightEventEntrySheet({ today, onDone }: { today: CalendarDate; onDone: () => void }) {
  const { services } = useApp();
  const overlays = useOverlays();
  // No default: a person adding travel must not record an illness by not looking (UX-21).
  const [type, setType] = useState<WeightEventType>();
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const pickDate = async () => {
    const picked = await overlays.date({
      helpText: 'Weight event date',
      initial: date,
      first: today.addDays(-28),
      last: today,
      today,
    });
    if (picked !== undefined) setDate(picked);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (type === undefined) return;
      await services.weightEvents.saveWeightEvent({ date, type });
    } catch {
      setSaving(false);
      overlays.snack('Could not save the weight event. Please try again.');
      return;
    }
    onDone();
  };

  return (
    <div className="progress-sheet">
      <h2 className="app-headline">Add a weight event</h2>
      <MmDropdown<WeightEventType | undefined>
        label="Event"
        value={type}
        placeholder="Choose an event"
        items={WeightEventType.values.map((value) => ({ value, label: weightEventLabel(value) }))}
        onChange={saving ? undefined : setType}
      />
      <MmListRow
        title="Date"
        subtitle={Fmt.day(date, today)}
        leadingIcon="calendar"
        opens
        onPress={saving ? undefined : () => void pickDate()}
      />
      <p className="app-text">Events can be added for the last 28 days.</p>
      <div className="app-row app-row-end">
        <MmButton label="Cancel" kind="text" onPress={saving ? undefined : onDone} />
        <MmButton label="Save event" onPress={saving || type === undefined ? undefined : () => void save()} />
      </div>
    </div>
  );
}
