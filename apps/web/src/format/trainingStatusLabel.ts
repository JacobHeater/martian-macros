import type { TrainingStatus } from '../domain';

const labels: Readonly<Record<TrainingStatus, string>> = {
  untrained: 'Not lifting yet',
  novice: 'Under 1 year',
  returning: 'Returning after 6+ months off',
  intermediate: '1–3 years',
  advanced: '3+ years',
};

export const trainingStatusLabel = (status: TrainingStatus): string => labels[status];
