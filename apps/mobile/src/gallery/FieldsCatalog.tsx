import { useState } from 'react';
import { CalendarDate } from '../domain/CalendarDate';
import { Fmt } from '../format/Fmt';
import { MmDropdown } from '../ui/MmDropdown';
import { MmOverlays } from '../ui/MmOverlays';
import { MmPickerField } from '../ui/MmPickerField';
import { MmTextField } from '../ui/MmTextField';
import { useOverlays } from '../ui/useOverlays';
import './gallery.css';

const today = CalendarDate.of(2026, 10, 13);

/** The fields themselves; they need the overlay host above them, which the catalog gives. */
function Fields() {
  const overlays = useOverlays();
  const [search, setSearch] = useState('');
  const [weight, setWeight] = useState('184.1');
  const [meal, setMeal] = useState('lunch');
  const [birth, setBirth] = useState(CalendarDate.of(1996, 1, 1));
  const [time, setTime] = useState(7 * 60);
  const two = (n: number) => String(n).padStart(2, '0');
  const said = `${time % 720 < 60 ? 12 : Math.floor((time % 720) / 60)}:${two(time % 60)} ${time < 720 ? 'AM' : 'PM'}`;
  return (
    <div className="gallery-stack">
      <MmTextField label="Search foods" value={search} onChange={setSearch} hint="Oats, chicken, rice" />
      <MmPickerField
        label="Date of birth"
        valueText={Fmt.longDate(birth)}
        onPress={() =>
          void overlays
            .date({ helpText: 'Date of birth', initial: birth, first: CalendarDate.of(1926, 1, 1), last: today, today })
            .then((picked) => picked !== undefined && setBirth(picked))
        }
      />
      <MmPickerField
        label="Weigh-in reminder"
        valueText={said}
        onPress={() =>
          void overlays
            .timeOfDay({ initialMinuteOfDay: time, helpText: 'Weigh-in reminder', first: 7 * 60, last: 21 * 60 - 1 })
            .then((picked) => picked !== undefined && setTime(picked))
        }
      />
      <MmTextField label="Weight" kind="number" suffix="lb" value={weight} onChange={setWeight} helper="This morning." />
      <MmTextField label="Protein g" kind="number" dense value="40" onChange={() => undefined} />
      <MmTextField label="Height" kind="number" suffix="cm" value="300" onChange={() => undefined} error="Between 100 and 250 cm." />
      <MmDropdown
        label="Meal"
        value={meal}
        items={[
          { value: 'breakfast', label: 'Breakfast' },
          { value: 'lunch', label: 'Lunch' },
          { value: 'dinner', label: 'Dinner' },
        ]}
        onChange={setMeal}
      />
      <MmDropdown label="Meal, off" value="lunch" items={[{ value: 'lunch', label: 'Lunch' }]} onChange={undefined} />
    </div>
  );
}

/** Every kind of field a person types or chooses in, to be looked at focused, in error and not (MM-239, MM-279). */
export function FieldsCatalog() {
  return (
    <MmOverlays>
      <Fields />
    </MmOverlays>
  );
}
