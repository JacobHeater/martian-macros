import { useState } from 'react';
import type { CalendarDate } from '../domain/CalendarDate';
import { WeightEventType } from '../domain/WeightEventType';
import { weightEventLabel } from '../format/weightEventLabel';
import { useApp } from '../app/useApp';
import { MmButton } from '../ui/MmButton';
import { MmDropdown } from '../ui/MmDropdown';
import { MmIcon } from '../ui/MmIcon';
import { MmListRow } from '../ui/MmListRow';
import { useOverlays } from '../ui/useOverlays';
import './progress.css';

/** Notes something that moves the scale without being fat or muscle, on a day in the last four weeks. */
export function WeightEventEntrySheet({ today, onDone }: { today: CalendarDate; onDone: () => void }) {
  const { services } = useApp();
  const overlays = useOverlays();
  const [type, setType] = useState<WeightEventType>('illness');
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);

  const pickDate = async () => {
    const picked = await overlays.date({
      helpText: 'Weight event date',
      initial: date,
      first: today.addDays(-28),
      last: today,
    });
    if (picked !== undefined) setDate(picked);
  };

  const save = async () => {
    setSaving(true);
    try {
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
      <MmDropdown<WeightEventType>
        label="Event"
        value={type}
        items={WeightEventType.values.map((value) => ({ value, label: weightEventLabel(value) }))}
        onChange={saving ? undefined : setType}
      />
      <MmListRow
        title="Date"
        subtitle={date.toString()}
        trailing={<MmIcon name="history" />}
        onPress={saving ? undefined : () => void pickDate()}
      />
      <p className="app-text">Events can be added for the last 28 days.</p>
      <div className="app-row app-row-end">
        <MmButton label="Cancel" kind="text" onPress={saving ? undefined : onDone} />
        <MmButton label="Save event" onPress={saving ? undefined : () => void save()} />
      </div>
    </div>
  );
}
