import type { ModeReason } from '../engine';

/** Added to every reason that rests on body fat, which the app only estimates (MM-132). */
const estimateNote = 'Body fat here is an estimate that can be off by a few points either way.';

const explanations: Readonly<Record<ModeReason, string>> = {
  deficitNotAllowed: 'Based on your health check, the app will not prescribe a calorie ' + 'deficit.',
  underweight:
    'Your weight is below the range where the app will plan a calorie ' +
    'deficit, so it starts you at maintenance. If you are not eating ' +
    'enough, talk to a clinician.',
  highBodyFat:
    'At your estimated body fat, steady fat loss gives the fastest visible ' +
    `progress while training protects your muscle. ${estimateNote}`,
  recompEligible:
    'With your training background and estimated body fat, you can ' +
    'realistically lose fat and gain muscle at the same time. ' +
    `${estimateNote}`,
  leanAndTrained:
    'You are already lean and trained, so building muscle needs a small ' + `surplus. ${estimateNote}`,
  cutFirst:
    'For trained lifters at moderate body fat, a focused cut works ' +
    `better than trying to do both at once. ${estimateNote}`,
};

/** Why the app suggests the goal it does. */
export const modeReasonExplanation = (reason: ModeReason): string => explanations[reason];
