import { useContext, useEffect, useState } from 'react';
import { ExerciseProgression } from '../domain/training/ExerciseProgression';
import { defaultLoadStepKg } from '../engine/defaultLoadStepKg';
import { defaultRepRange } from '../engine/defaultRepRange';
import { Fmt } from '../format/Fmt';
import { loadNumber } from '../format/loadNumber';
import { parseNumber } from '../format/parseNumber';
import { tryParseInt } from '../lang/tryParseInt';
import { CloseScreenContext } from '../app/CloseScreenContext';
import { Screen } from '../app/Screen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useLoaded } from '../app/useLoaded';
import { MmButton } from '../ui/MmButton';
import { MmTextField } from '../ui/MmTextField';
import './train.css';

/**
 * Setting the rep range and the load step suggestions are made with for
 * one exercise (MM-79), or going back to the defaults.
 */
export function ProgressionSettingsScreen({ exerciseId }: { exerciseId: string }) {
  const { services, state } = useApp();
  const close = useContext(CloseScreenContext);
  const exercise = useCell(state.exercisesById).get(exerciseId);
  const units = useLoaded(state.setup)?.unitSystem ?? 'imperial';
  const fmt = new Fmt(units);
  const saved = useLoaded(state.exerciseProgressions);
  const current = saved?.get(exerciseId);
  const [defaultLow, defaultHigh] = defaultRepRange(exercise);
  const usualStep = defaultLoadStepKg({ exercise, units });
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const [step, setStep] = useState('');
  const [filled, setFilled] = useState(false);

  // Filled once what is saved has loaded, then left to the user.
  useEffect(() => {
    if (filled || saved === undefined) return;
    setFilled(true);
    setLow(`${current?.repsLow ?? defaultLow}`);
    setHigh(`${current?.repsHigh ?? defaultHigh}`);
    setStep(current?.loadStepKg === undefined ? '' : loadNumber(fmt.weightFromKg(current.loadStepKg)));
    // `fmt` is made anew on every draw; the units it is made from do not change while this is open.
  }, [filled, saved, current, defaultLow, defaultHigh]);

  const fewest = tryParseInt(low.trim());
  const most = tryParseInt(high.trim());
  const by = parseNumber(step);

  /** What is wrong with what is typed, or undefined when it can be saved. */
  const problem = ((): string | undefined => {
    if (fewest === undefined || most === undefined) return 'Enter both ends of the range.';
    if (fewest < 1) return 'The fewest reps is at least 1.';
    if (most > ExerciseProgression.maxReps) return `The most reps is at most ${ExerciseProgression.maxReps}.`;
    if (fewest >= most) return 'The most reps has to be more than the fewest.';
    if (step.trim() !== '' && (by === undefined || by <= 0)) {
      return 'The load step is a number above zero, or left empty.';
    }
    return undefined;
  })();

  const save = async () => {
    if (fewest === undefined || most === undefined) return;
    await services.exerciseProgressions.saveExerciseProgression(
      new ExerciseProgression({
        exerciseId,
        repsLow: fewest,
        repsHigh: most,
        loadStepKg: step.trim() === '' || by === undefined ? undefined : fmt.weightToKg(by),
      }),
    );
    close?.();
  };

  const useDefaults = async () => {
    await services.exerciseProgressions.clearExerciseProgression(exerciseId);
    close?.();
  };

  return (
    <Screen title={exercise?.name ?? 'Suggestions'}>
      <p className="app-text">
        A suggestion adds reps within this range until every set reaches the top, then adds one load step and goes back
        to the bottom. These are yours to set; no range is the right one.
      </p>
      <div className="app-gap" />
      <div className="train-fields">
        <MmTextField label="Fewest reps" kind="number" value={low} onChange={setLow} />
        <MmTextField label="Most reps" kind="number" value={high} onChange={setHigh} />
      </div>
      <div className="app-gap" />
      <MmTextField
        label="Load step"
        suffix={fmt.weightUnit}
        helper={`Leave empty for the usual step: ${loadNumber(fmt.weightFromKg(usualStep))} ${fmt.weightUnit}.`}
        kind="number"
        value={step}
        onChange={setStep}
      />
      {problem === undefined ? null : (
        <p className="app-caption train-problem" role="alert">
          {problem}
        </p>
      )}
      <div className="app-gap-large" />
      <MmButton label="Save" expand onPress={problem === undefined ? () => void save() : undefined} />
      <div className="app-gap-small" />
      <MmButton
        label="Use the defaults"
        kind="text"
        expand
        onPress={current === undefined ? undefined : () => void useDefaults()}
      />
    </Screen>
  );
}
