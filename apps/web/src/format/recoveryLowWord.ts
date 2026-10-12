import type { RecoveryQuestion } from '../domain';

const words: Readonly<Record<RecoveryQuestion, string>> = {
  hunger: 'Constant',
  energy: 'Drained',
  sleep: 'Poor',
  training: 'A slog',
  mood: 'Irritable',
};

/** The word at 1, the hard end. */
export const recoveryLowWord = (question: RecoveryQuestion): string => words[question];
