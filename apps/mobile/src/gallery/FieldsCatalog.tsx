import { useState } from 'react';
import { MmDropdown } from '../ui/MmDropdown';
import { MmPickerField } from '../ui/MmPickerField';
import { MmTextField } from '../ui/MmTextField';
import './gallery.css';

/** Every kind of field a person types or chooses in, to be looked at focused and not (MM-239). */
export function FieldsCatalog() {
  const [search, setSearch] = useState('');
  const [weight, setWeight] = useState('184.1');
  const [meal, setMeal] = useState('lunch');
  const [birth, setBirth] = useState('1996-01-01');
  const [time, setTime] = useState('07:00');
  return (
    <div className="gallery-stack">
      <MmTextField label="Search foods" value={search} onChange={setSearch} hint="Oats, chicken, rice" />
      <MmPickerField kind="date" label="Date of birth" value={birth} onChange={setBirth} />
      <MmPickerField kind="time" label="Weigh-in reminder" value={time} onChange={setTime} />
      <MmTextField label="Weight" kind="number" suffix="lb" value={weight} onChange={setWeight} helper="This morning." />
      <MmTextField label="Protein g" kind="number" dense value="40" onChange={() => undefined} />
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
    </div>
  );
}
