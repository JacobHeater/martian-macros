import { useState } from 'react';
import type { Exercise } from '../domain/training/Exercise';
import { recentExerciseIds } from '../engine/recentExerciseIds';
import { searchExercises } from '../engine/searchExercises';
import { equipmentLabel } from '../format/equipmentLabel';
import { muscleGroupLabel } from '../format/muscleGroupLabel';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { GroupHeader } from '../ui/GroupHeader';
import { MmButton } from '../ui/MmButton';
import { MmListRow } from '../ui/MmListRow';
import { MmTextField } from '../ui/MmTextField';
import { CustomExerciseScreen } from './CustomExerciseScreen';

/**
 * Choosing an exercise for a workout (MM-76): recently used ones first,
 * then search over the built-in library and the user's own. `onPick` is
 * called with the chosen exercise's id.
 */
export function ExercisePickerScreen({ onPick }: { onPick: (exerciseId: string) => void }) {
  const { state } = useApp();
  const navigator = useNavigator();
  const [search, setSearch] = useState('');
  const recent = recentExerciseIds(useLoaded(state.workouts) ?? []);
  const found = searchExercises({ query: search, exercises: useCell(state.exercises), recentIds: recent });
  // With nothing typed, the recently used lead the list under their own heading.
  const recentCount = search.trim() === '' ? found.filter((exercise) => recent.includes(exercise.id)).length : 0;

  const create = async () => {
    const id = await navigator.push<string>((close) => <CustomExerciseScreen name={search.trim()} onSaved={close} />);
    if (id !== undefined) onPick(id);
  };

  const row = (exercise: Exercise) => (
    <MmListRow
      key={exercise.id}
      dense
      title={exercise.name}
      subtitle={
        `${equipmentLabel(exercise.equipment)} · ${muscleGroupLabel(exercise.primary)}` +
        `${exercise.isCustom ? ' · Yours' : ''}`
      }
      onPress={() => onPick(exercise.id)}
    />
  );

  return (
    <Screen title="Choose an exercise">
      <MmTextField label="Search exercises" value={search} onChange={setSearch} />
      {recentCount > 0 ? (
        <>
          <GroupHeader text="Recent" />
          {found.slice(0, recentCount).map(row)}
          <GroupHeader text="All exercises" />
          {found.slice(recentCount).map(row)}
        </>
      ) : (
        found.map(row)
      )}
      <div className="app-gap" />
      {found.length === 0 ? <p className="app-text">No exercise by that name.</p> : null}
      <MmButton label="Create your own exercise" kind="secondary" expand onPress={() => void create()} />
    </Screen>
  );
}
