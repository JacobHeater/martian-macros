import { useState } from 'react';
import type { ExerciseLoad } from '../domain/training/ExerciseLoad';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { placeTimeOfDay } from '../engine/placeTimeOfDay';
import type { TimeSpanProblem } from '../engine/TimeSpanProblem';
import { clockTimeText } from '../format/clockTimeText';
import type { Fmt } from '../format/Fmt';
import { loadNumber } from '../format/loadNumber';
import { parseNumber } from '../format/parseNumber';
import { rirText } from '../format/rirText';
import { timeSpanProblemMessage } from '../format/timeSpanProblemMessage';
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
   * What is wrong with a typed start and end, if anything. A time that
   * fails is refused and the set keeps what it had.
   */
  checkTimes: (start: Date | undefined, end: Date | undefined) => TimeSpanProblem | undefined;
  onRemove: () => void;
}

const rirs = Array.from({ length: WorkoutSet.maxRir + 1 }, (_, rir) => rir);
const timeText = (time: Date | undefined) => (time === undefined ? 'Not timed' : clockTimeText(time, { seconds: true }));

/**
 * The controls for one set (MM-75): reps and load, each typed or stepped
 * with large buttons, and reps in reserve. Every change is reported at
 * once.
 */
export function SetEditor({ set: given, number, load, fmt, onChange, timeBase, timeLimit, checkTimes, onRemove }: SetEditorProps) {
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
  const bodyweight = load === 'bodyweight';
  /** One plate change: 5 lb, or 2.5 kg. */
  const loadStep = fmt.imperial ? 5 : 2.5;

  const change = (next: WorkoutSet) => {
    setSet(next);
    onChange(next);
  };

  const typedReps = (text: string) => {
    setReps(text);
    const typed = tryParseInt(text.trim());
    if (typed === undefined || typed < 0) return;
    change(set.copyWith({ reps: typed }));
  };

  const typedLoad = (text: string) => {
    setLoadText(text);
    const value = parseNumber(text);
    if (value === undefined) return;
    change(set.copyWith({ loadKg: fmt.weightToKg(value) }));
  };

  const stepReps = (by: number) => {
    const next = clamp(set.reps + by, 0, 999);
    setReps(`${next}`);
    change(set.copyWith({ reps: next }));
  };

  const stepLoad = (by: number) => {
    let value = (parseNumber(loadText) ?? 0) + by;
    // Only a bodyweight exercise goes below zero (assisted work).
    if (load === 'addedWeight' && value < 0) value = 0;
    setLoadText(loadNumber(value));
    change(set.copyWith({ loadKg: fmt.weightToKg(value) }));
  };

  /**
   * Sets the start or the end by hand, to the second. A time that cannot
   * be right is refused with the reason.
   */
  const pickTime = async (start: boolean) => {
    const current = start ? set.startedAt : set.endedAt;
    const opensAt = current ?? set.endedAt ?? timeBase;
    const timeOfDayMs = await overlays.clockTime({
      title: start ? 'Set started' : 'Set ended',
      initialMs: (opensAt.getHours() * 3600 + opensAt.getMinutes() * 60 + opensAt.getSeconds()) * 1000,
    });
    if (timeOfDayMs === undefined) return;
    const picked = placeTimeOfDay({ notBefore: timeBase, notAfter: timeLimit(), timeOfDayMs });
    const changed = start ? set.copyWith({ startedAt: picked }) : set.copyWith({ endedAt: picked });
    const problem = checkTimes(changed.startedAt, changed.endedAt);
    if (problem !== undefined) {
      overlays.snack(timeSpanProblemMessage(problem));
      return;
    }
    change(changed);
  };

  const loadLabel = bodyweight ? 'Added weight' : 'Load';
  return (
    <div className="train-set-editor" role="group" aria-label={`Set ${number}`}>
      <p className="train-set-title">Set {number}</p>
      <div className="train-stepper">
        <MmIconButton icon="minus" label="Less: Reps" onPress={() => stepReps(-1)} />
        <MmTextField label="Reps" kind="number" dense value={reps} onChange={typedReps} />
        <MmIconButton icon="plus" label="More: Reps" onPress={() => stepReps(1)} />
      </div>
      <div className="train-stepper">
        <MmIconButton icon="minus" label={`Less: ${loadLabel}`} onPress={() => stepLoad(-loadStep)} />
        <MmTextField
          label={loadLabel}
          suffix={fmt.weightUnit}
          helper={bodyweight ? 'Below zero for assisted work' : undefined}
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
      <MmListRow dense title="Ended" subtitle={timeText(set.endedAt)} opens onPress={() => void pickTime(false)} />
      <div className="app-row app-row-end">
        <MmButton label="Remove set" kind="text" onPress={onRemove} />
      </div>
    </div>
  );
}
