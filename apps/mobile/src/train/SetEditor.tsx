import { useState } from 'react';
import type { ExerciseLoad } from '../domain/training/ExerciseLoad';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { placeTimeOfDay } from '../engine/placeTimeOfDay';
import { clockTimeText } from '../format/clockTimeText';
import { elapsedText } from '../format/elapsedText';
import type { Fmt } from '../format/Fmt';
import { loadNumber } from '../format/loadNumber';
import { parseNumber } from '../format/parseNumber';
import { rirText } from '../format/rirText';
import { clamp } from '../lang/clamp';
import { tryParseInt } from '../lang/tryParseInt';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { MmSegmented } from '../ui/MmSegmented';
import { MmTextField } from '../ui/MmTextField';
import { useOverlays } from '../ui/useOverlays';
import './train.css';

interface SetEditorProps {
  set: WorkoutSet;
  /** Which set of the exercise this is, from 1. */
  number: number;
  load: ExerciseLoad;
  fmt: Fmt;
  onChange: (set: WorkoutSet) => void;
  /**
   * When the workout began: a typed time of day is on that day, or the
   * next when the workout ran past midnight, and the entry opens there
   * when the set has no time yet (MM-191).
   */
  timeBase: Date;
  /** The latest a typed time can be: the workout's end, or now. */
  timeLimit: () => Date;
  /**
   * What is wrong with a typed start and end, in words, if anything. A
   * time that fails is refused while the clock is still open, with what was
   * chosen on it, and the set keeps what it had (MM-222).
   */
  refuseTimes: (start: Date | undefined, end: Date | undefined) => string | undefined;
  /** Closes the controls back to the set's row (MM-222). */
  onClose: () => void;
  /** Removes the set, given as it is here, so an Undo can put it back (MM-215). */
  onRemove: (set: WorkoutSet) => void;
}

const rirs = Array.from({ length: WorkoutSet.maxRir + 1 }, (_, rir) => rir);
const timeText = (time: Date | undefined) => (time === undefined ? 'Not timed' : clockTimeText(time, { seconds: true }));
/** The end, with how long the set took when it has both times, beside where they are changed (MM-222). */
const endText = (set: WorkoutSet) =>
  set.durationMs === undefined ? timeText(set.endedAt) : `${timeText(set.endedAt)} · took ${elapsedText(set.durationMs)}`;

/**
 * The controls for one set (MM-75): reps and load, each typed or stepped
 * with large buttons, and reps in reserve. Every change is reported at
 * once, and the controls say so: the set is recorded (MM-222).
 */
export function SetEditor({
  set: given,
  number,
  load,
  fmt,
  onChange,
  timeBase,
  timeLimit,
  refuseTimes,
  onClose,
  onRemove,
}: SetEditorProps) {
  const overlays = useOverlays();
  /**
   * The set as edited here. While the controls are open this is the truth:
   * two quick taps must not lose the first to a save that has not come
   * back yet.
   */
  const [set, setSet] = useState(given);
  // A new set with nothing in it yet starts with empty fields, so the first
  // number is typed without clearing a zero.
  const [reps, setReps] = useState(given.reps === 0 ? '' : `${given.reps}`);
  const [loadText, setLoadText] = useState(given.loadKg === 0 ? '' : loadNumber(fmt.weightFromKg(given.loadKg)));
  // MM-214: a typed value that cannot be kept says so, and what the set has instead.
  const [repsRefused, setRepsRefused] = useState(false);
  const [loadRefused, setLoadRefused] = useState(false);
  const bodyweight = load === 'bodyweight';
  /** One plate change: 5 lb, or 2.5 kg. */
  const loadStep = fmt.imperial ? 5 : 2.5;

  const change = (next: WorkoutSet) => {
    setSet(next);
    onChange(next);
  };

  const typedReps = (text: string) => {
    setReps(text);
    // An empty field is no reps, as a new set's is (MM-214).
    const typed = text.trim() === '' ? 0 : tryParseInt(text);
    const kept = typed !== undefined && typed >= 0;
    setRepsRefused(!kept);
    if (kept) change(set.copyWith({ reps: typed }));
  };

  const typedLoad = (text: string) => {
    setLoadText(text);
    // An empty field is no load (MM-214).
    const value = text.trim() === '' ? 0 : parseNumber(text);
    setLoadRefused(value === undefined);
    if (value !== undefined) change(set.copyWith({ loadKg: fmt.weightToKg(value) }));
  };

  const stepReps = (by: number) => {
    const next = clamp(set.reps + by, 0, 999);
    setReps(`${next}`);
    setRepsRefused(false);
    change(set.copyWith({ reps: next }));
  };

  const stepLoad = (by: number) => {
    let value = (parseNumber(loadText) ?? 0) + by;
    // Only a bodyweight exercise goes below zero (assisted work).
    if (load === 'addedWeight' && value < 0) value = 0;
    setLoadText(loadNumber(value));
    setLoadRefused(false);
    change(set.copyWith({ loadKg: fmt.weightToKg(value) }));
  };

  /**
   * Sets the start or the end by hand, to the second. A time that cannot
   * be right is refused with the reason while the clock is open, so what
   * was chosen is not lost (MM-222).
   */
  const pickTime = async (start: boolean) => {
    const current = start ? set.startedAt : set.endedAt;
    const opensAt = current ?? set.endedAt ?? timeBase;
    const withTime = (timeOfDayMs: number) => {
      const picked = placeTimeOfDay({ notBefore: timeBase, notAfter: timeLimit(), timeOfDayMs });
      return start ? set.copyWith({ startedAt: picked }) : set.copyWith({ endedAt: picked });
    };
    const timeOfDayMs = await overlays.clockTime({
      title: start ? 'Set started' : 'Set ended',
      initialMs: (opensAt.getHours() * 3600 + opensAt.getMinutes() * 60 + opensAt.getSeconds()) * 1000,
      refuse: (ms) => {
        const changed = withTime(ms);
        return refuseTimes(changed.startedAt, changed.endedAt);
      },
    });
    if (timeOfDayMs === undefined) return;
    change(withTime(timeOfDayMs));
  };

  const loadLabel = bodyweight ? 'Added weight' : 'Load';
  return (
    <div className="train-set-editor" role="group" aria-label={`Set ${number}`}>
      <p className="train-set-title">Set {number}</p>
      <p className="app-caption train-set-recorded">Recorded. Changes are kept as you make them.</p>
      <div className="train-stepper">
        <MmIconButton icon="minus" label="Less: Reps" onPress={() => stepReps(-1)} />
        <MmTextField
          label="Reps"
          kind="count"
          dense
          value={reps}
          error={repsRefused ? `Whole reps only. The set has ${set.reps}.` : undefined}
          onChange={typedReps}
        />
        <MmIconButton icon="plus" label="More: Reps" onPress={() => stepReps(1)} />
      </div>
      <div className="train-stepper">
        <MmIconButton icon="minus" label={`Less: ${loadLabel}`} onPress={() => stepLoad(-loadStep)} />
        <MmTextField
          label={loadLabel}
          suffix={fmt.weightUnit}
          helper={bodyweight ? 'Below zero for assisted work' : undefined}
          error={loadRefused ? `Not a number. The set has ${loadNumber(fmt.weightFromKg(set.loadKg))} ${fmt.weightUnit}.` : undefined}
          kind="number"
          dense
          value={loadText}
          onChange={typedLoad}
        />
        <MmIconButton icon="plus" label={`More: ${loadLabel}`} onPress={() => stepLoad(loadStep)} />
      </div>
      <p className="app-caption train-rir-label">Reps in reserve (optional)</p>
      <MmSegmented<number>
        name="Reps in reserve"
        compact
        allowEmpty
        segments={rirs.map((rir) => ({ value: rir, label: rirText(rir) }))}
        selected={set.rir}
        // Tapping the chosen one again clears it.
        onChange={(chosen) => change(set.copyWith({ rir: chosen }))}
      />
      <MmListRow dense title="Started" subtitle={timeText(set.startedAt)} opens onPress={() => void pickTime(true)} />
      <MmListRow dense title="Ended" subtitle={endText(set)} opens onPress={() => void pickTime(false)} />
      <div className="app-row app-row-end">
        <MmButton label="Remove set" kind="text" onPress={() => onRemove(set)} />
        <MmButton label="Done" kind="secondary" onPress={onClose} />
      </div>
    </div>
  );
}
