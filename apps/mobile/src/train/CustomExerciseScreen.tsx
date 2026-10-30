import { useState } from 'react';
import { Equipment } from '../domain/training/Equipment';
import { Exercise } from '../domain/training/Exercise';
import type { ExerciseLoad } from '../domain/training/ExerciseLoad';
import { MuscleGroup } from '../domain/training/MuscleGroup';
import { equipmentLabel } from '../format/equipmentLabel';
import { muscleGroupLabel } from '../format/muscleGroupLabel';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { MmButton } from '../ui/MmButton';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmDropdown } from '../ui/MmDropdown';
import { MmSegmented } from '../ui/MmSegmented';
import { MmTextField } from '../ui/MmTextField';
import { SectionLabel } from '../ui/SectionLabel';

interface CustomExerciseScreenProps {
  /** What was typed in the search, as a start for the name. */
  name?: string;
  /** An exercise of the user's own being changed (MM-706): the fields start from it, and saving replaces it. */
  exercise?: Exercise | undefined;
  /** Called with the exercise's id once it is saved. */
  onSaved: (id: string) => void;
}

/** Adding an exercise of the user's own (MM-76), with the same fields as a built-in one; or changing one (MM-706). */
export function CustomExerciseScreen({ name: firstName = '', exercise, onSaved }: CustomExerciseScreenProps) {
  const { services } = useApp();
  const [name, setName] = useState(exercise?.name ?? firstName);
  const [equipment, setEquipment] = useState<Equipment>(exercise?.equipment ?? 'barbell');
  const [primary, setPrimary] = useState<MuscleGroup>(exercise?.primary ?? 'chest');
  const [secondary, setSecondary] = useState<ReadonlySet<MuscleGroup>>(new Set(exercise?.secondary ?? []));
  const [load, setLoad] = useState<ExerciseLoad>(exercise?.load ?? 'addedWeight');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const id = await services.customExercises.saveCustomExercise(
      new Exercise({
        id: exercise?.id ?? '',
        name: name.trim(),
        equipment,
        primary,
        secondary: MuscleGroup.values.filter((muscle) => secondary.has(muscle) && muscle !== primary),
        load,
      }),
    );
    onSaved(id);
  };

  const toggle = (muscle: MuscleGroup) => {
    const next = new Set(secondary);
    if (!next.delete(muscle)) next.add(muscle);
    setSecondary(next);
  };

  return (
    <Screen title={exercise === undefined ? 'Your own exercise' : 'Edit your exercise'}>
      <MmTextField label="Name" value={name} onChange={setName} />
      <div className="app-gap" />
      <MmDropdown<Equipment>
        label="Equipment"
        value={equipment}
        items={Equipment.values.map((value) => ({ value, label: equipmentLabel(value) }))}
        onChange={setEquipment}
      />
      <div className="app-gap" />
      <MmDropdown<MuscleGroup>
        label="Main muscle group"
        value={primary}
        items={MuscleGroup.values.map((value) => ({ value, label: muscleGroupLabel(value) }))}
        onChange={setPrimary}
      />
      <div className="app-gap" />
      <SectionLabel text="Also trains (optional)" />
      <div className="app-row" role="group" aria-label="Also trains">
        {MuscleGroup.values
          .filter((muscle) => muscle !== primary)
          .map((muscle) => (
            <MmChoiceChip
              key={muscle}
              label={muscleGroupLabel(muscle)}
              selected={secondary.has(muscle)}
              onSelect={() => toggle(muscle)}
            />
          ))}
      </div>
      <div className="app-gap" />
      <SectionLabel text="What the load you log means" />
      <MmSegmented<ExerciseLoad>
        name="What the load you log means"
        segments={[
          { value: 'addedWeight', label: 'The weight moved' },
          { value: 'bodyweight', label: 'Added to bodyweight' },
        ]}
        selected={load}
        onChange={(chosen) => setLoad(chosen ?? load)}
      />
      <div className="app-gap-large" />
      <MmButton label="Save exercise" expand onPress={name.trim() === '' || saving ? undefined : () => void save()} />
    </Screen>
  );
}
