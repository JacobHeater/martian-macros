import type { MuscleGroup } from '../domain/training/MuscleGroup';

export class MuscleVolume {
  readonly group: MuscleGroup;
  readonly currentSets: number;
  readonly previousSets: number;

  constructor(init: { group: MuscleGroup; currentSets: number; previousSets: number }) {
    this.group = init.group;
    this.currentSets = init.currentSets;
    this.previousSets = init.previousSets;
  }

  get change(): number {
    return this.currentSets - this.previousSets;
  }
}
