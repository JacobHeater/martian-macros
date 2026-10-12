import type { MuscleGroup } from '../domain';

const labels: Readonly<Record<MuscleGroup, string>> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
};

export const muscleGroupLabel = (group: MuscleGroup): string => labels[group];
