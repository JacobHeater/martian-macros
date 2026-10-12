interface WorkoutSetInit {
  reps: number;
  loadKg: number;
  rir?: number | undefined;
  startedAt?: Date | undefined;
  endedAt?: Date | undefined;
}

/**
 * What `copyWith` may change. A key that is absent keeps the value; `rir`,
 * `startedAt` and `endedAt` are cleared by giving the key with `undefined`.
 */
interface WorkoutSetChanges {
  reps?: number;
  loadKg?: number;
  rir?: number | undefined;
  startedAt?: Date | undefined;
  endedAt?: Date | undefined;
}

/** One set of an exercise (MM-75). */
export class WorkoutSet {
  /** The highest reps in reserve recorded; it stands for "5 or more". */
  static readonly maxRir = 5;

  readonly reps: number;

  /**
   * The weight moved, in kilograms. For a bodyweight exercise it is the
   * weight added to the body: zero, or negative for assisted work.
   */
  readonly loadKg: number;

  /**
   * Reps in reserve, 0 to `maxRir`, where `maxRir` means that many or more.
   * Undefined when it was not recorded.
   */
  readonly rir: number | undefined;

  /**
   * When the set began and ended (MM-191). Either may be unknown: a set
   * logged without the set timer has an end and no start, and a set logged
   * afterwards may have neither. Never invented.
   */
  readonly startedAt: Date | undefined;
  readonly endedAt: Date | undefined;

  constructor(init: WorkoutSetInit) {
    this.reps = init.reps;
    this.loadKg = init.loadKg;
    this.rir = init.rir;
    this.startedAt = init.startedAt;
    this.endedAt = init.endedAt;
  }

  /** How long the set took in milliseconds, when both times are known. */
  get durationMs(): number | undefined {
    const start = this.startedAt;
    const end = this.endedAt;
    return start === undefined || end === undefined ? undefined : end.getTime() - start.getTime();
  }

  copyWith(changes: WorkoutSetChanges): WorkoutSet {
    return new WorkoutSet({
      reps: changes.reps ?? this.reps,
      loadKg: changes.loadKg ?? this.loadKg,
      rir: 'rir' in changes ? changes.rir : this.rir,
      startedAt: 'startedAt' in changes ? changes.startedAt : this.startedAt,
      endedAt: 'endedAt' in changes ? changes.endedAt : this.endedAt,
    });
  }
}
