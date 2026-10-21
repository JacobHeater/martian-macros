import type { Equipment } from './Equipment';
import type { ExerciseLoad } from './ExerciseLoad';
import type { HealthConnectSegment } from './HealthConnectSegment';
import type { MuscleGroup } from './MuscleGroup';

interface ExerciseInit {
  id: string;
  name: string;
  equipment: Equipment;
  primary: MuscleGroup;
  secondary?: readonly MuscleGroup[];
  load?: ExerciseLoad;
  healthConnect?: HealthConnectSegment | undefined;
}

/**
 * Something sets are logged against (MM-76): one of the built-in exercises,
 * or one the user added.
 */
export class Exercise {
  /**
   * What the id of every exercise the user added starts with. No built-in
   * exercise's id does.
   */
  static readonly customIdPrefix = 'custom-';

  /**
   * The id an imported set is logged against when the platform named a
   * movement the library cannot place (MM-189): "Other exercise", kept with
   * its time so nothing is lost, and re-chosen by the user. No built-in or
   * custom exercise has it.
   */
  static readonly otherId = 'other-exercise';

  /**
   * Permanent. Logged sets refer to it, so it outlives a change of name.
   * Empty for one of the user's own that is not yet saved.
   */
  readonly id: string;
  readonly name: string;
  readonly equipment: Equipment;

  /** The muscle group a set counts fully toward (MM-78). */
  readonly primary: MuscleGroup;

  /** The muscle groups a set counts half toward (MM-78). */
  readonly secondary: readonly MuscleGroup[];
  readonly load: ExerciseLoad;

  /**
   * What Health Connect calls this movement, if it names it (MM-189).
   * Undefined is a normal state: the exercise stays in the app and is left
   * out of what a platform is told, never written as a different one.
   */
  readonly healthConnect: HealthConnectSegment | undefined;

  constructor(init: ExerciseInit) {
    this.id = init.id;
    this.name = init.name;
    this.equipment = init.equipment;
    this.primary = init.primary;
    this.secondary = init.secondary ?? [];
    this.load = init.load ?? 'addedWeight';
    this.healthConnect = init.healthConnect;
  }

  /** Whether the user added this exercise. */
  get isCustom(): boolean {
    return this.id.length === 0 || this.id.startsWith(Exercise.customIdPrefix);
  }

  withId(id: string): Exercise {
    return new Exercise({
      id,
      name: this.name,
      equipment: this.equipment,
      primary: this.primary,
      secondary: this.secondary,
      load: this.load,
      healthConnect: this.healthConnect,
    });
  }
}
