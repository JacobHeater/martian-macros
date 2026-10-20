import type { Pause } from '../domain/Pause';
import type { SetupRepository } from '../domain/repositories/SetupRepository';
import type { UserSetup } from '../domain/UserSetup';
import type { CalendarDate } from '../domain/CalendarDate';
import type { CoachSnapshot } from '../engine/CoachSnapshot';
import { nextTargets } from '../engine/nextTargets';
import type { TargetsHistoryRepository } from '../engine/TargetsHistoryRepository';
import type { TargetsRecord } from '../engine/TargetsRecord';
import type { Unsubscribe } from '../lang/Unsubscribe';
import type { Cell } from './Cell';
import { DerivedCell } from './DerivedCell';
import { ValueCell } from './ValueCell';

interface CheckInInputs {
  readonly setup: () => UserSetup | undefined;
  readonly coach: Cell<CoachSnapshot | undefined>;
  readonly history: () => readonly TargetsRecord[] | undefined;
  readonly pauses: () => readonly Pause[];
  /** The person's choice to leave a deficit in two steps (MM-130); undefined until the preference is read. */
  readonly easeIntoMaintenance?: () => boolean | undefined;
  /** On lean gain, whether training has lapsed (MM-134); undefined until the training log is read. */
  readonly trainingLapsed?: () => boolean | undefined;
  readonly today: Cell<CalendarDate>;
  readonly targets: TargetsHistoryRepository;
  readonly setups: SetupRepository;
}

/**
 * Persists the engine's decisions for as long as the app is open: when new
 * targets are due they are saved. It remembers which target changes were
 * made this launch, so that their summaries wait until the next opening.
 */
export class CheckIn {
  private readonly made = new ValueCell<ReadonlySet<number>>(new Set());
  private readonly due: Cell<TargetsRecord | undefined>;
  private readonly inputs: CheckInInputs;
  private saving = false;

  /** The last thing that went wrong saving, if anything did. */
  error: unknown;

  constructor(inputs: CheckInInputs) {
    this.inputs = inputs;
    this.due = new DerivedCell(() => {
      const setup = inputs.setup();
      const snapshot = inputs.coach.value;
      const history = inputs.history();
      const pauses = inputs.pauses();
      const today = inputs.today.value;
      if (setup === undefined || snapshot === undefined || history === undefined) return undefined;
      // Nothing is decided before everything it rests on is read: a check-in
      // made before the training log or the preferences arrived would be
      // made from the wrong facts, and the day would then be taken.
      const easeIntoMaintenance = inputs.easeIntoMaintenance === undefined ? false : inputs.easeIntoMaintenance();
      const trainingLapsed = inputs.trainingLapsed === undefined ? false : inputs.trainingLapsed();
      if (easeIntoMaintenance === undefined || trainingLapsed === undefined) return undefined;
      return nextTargets({ setup, snapshot, history, today, pauses, easeIntoMaintenance, trainingLapsed });
    });
  }

  /** The days (as epoch days) whose targets were issued this launch as a change from earlier ones. */
  get generatedThisLaunch(): Cell<ReadonlySet<number>> {
    return this.made;
  }

  /** Starts watching for targets that are due. Stop it with what it returns. */
  start(): Unsubscribe {
    return this.due.subscribe((next) => {
      if (next !== undefined) void this.save(next);
    });
  }

  private async save(next: TargetsRecord): Promise<void> {
    // One at a time: the save changes the history, which works this out again.
    if (this.saving) return;
    this.saving = true;
    try {
      if (next.explanation?.previousKcal !== undefined) {
        this.made.put(new Set([...this.made.value, next.effectiveFrom.epochDay]));
      }
      const setup = this.inputs.setup();
      // Targets first: the goal change below works the next targets out again.
      await this.inputs.targets.saveTargets(next);
      if (setup !== undefined && next.mode === 'maintenance' && setup.goalMode !== 'maintenance') {
        // Low body weight (MM-111) or a health check answer (MM-83) ruled the
        // goal out: make maintenance the user's goal, so a deficit does not
        // resume by itself when the reason goes away.
        await this.inputs.setups.saveSetup(setup.copyWith({ goalMode: 'maintenance' }));
      }
    } catch (error) {
      this.error = error;
    } finally {
      this.saving = false;
    }
    // Anything that became due while this was being saved.
    const again = this.due.peek();
    if (again !== undefined && again !== next && this.due.watched) void this.save(again);
  }
}
