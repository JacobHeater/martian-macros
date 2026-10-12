import type { RecoveryQuestion } from '../domain';

const labels: Readonly<Record<RecoveryQuestion, string>> = {
  hunger: 'Hunger',
  energy: 'Energy',
  sleep: 'Sleep',
  training: 'Training',
  mood: 'Mood',
};

export const recoveryQuestionLabel = (question: RecoveryQuestion): string => labels[question];
