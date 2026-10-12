import type { RecoveryQuestion } from '../domain';

const words: Readonly<Record<RecoveryQuestion, string>> = {
  hunger: 'Manageable',
  energy: 'Steady',
  sleep: 'Sound',
  training: 'Strong',
  mood: 'Even',
};

/** The word at 5, the easy end. */
export const recoveryHighWord = (question: RecoveryQuestion): string => words[question];
