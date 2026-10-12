import type { RecoveryQuestion } from '../domain';

const questions: Readonly<Record<RecoveryQuestion, string>> = {
  hunger: 'How was hunger this week?',
  energy: 'How was your energy through the day?',
  sleep: 'How well did you sleep?',
  training: 'How did training feel?',
  mood: 'How was your mood?',
};

/** The fixed words of the weekly recovery check-in (MM-116). */
export const recoveryQuestionText = (question: RecoveryQuestion): string => questions[question];
