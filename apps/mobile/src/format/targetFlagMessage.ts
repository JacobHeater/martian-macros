import type { TargetFlag } from '../engine';

const messages: Readonly<Record<TargetFlag, string>> = {
  flooredAtSafetyMinimum:
    'Your calories are at the lowest level the app will set. Going ' + 'lower risks your health and your muscle.',
  raisedForSafePace:
    'You were losing weight faster than the app aims for at your body ' +
    'fat, because faster loss costs more muscle. Targets went up.',
  heldAfterSafetyRaise:
    'Your targets went up last week because you were losing faster than ' +
    'the app aims for. They hold at that level this week.',
  heldByUser: 'You kept last week’s targets. They may come down at the next ' + 'check-in.',
  rateLimited:
    'This week’s change was limited to a small step. Targets move ' + 'gradually so one odd week can’t swing them.',
  requestedBreak: 'This is the maintenance week you chose. The deficit can resume at ' + 'the next check-in.',
  dietBreak: 'You’ve been in a deficit for 16 weeks. This is a maintenance ' + 'break to recover before continuing.',
  underweightMaintenance:
    'Your weight is below the range where the app will plan a calorie ' +
    'deficit, so targets are at maintenance. If you are not eating ' +
    'enough, talk to a clinician.',
  modeNotAllowed:
    'Your chosen goal isn’t available with your health check, so the ' + 'app is holding you at maintenance.',
  proteinCapped: 'Protein is capped because of your health check.',
  deficitCapped:
    'Your deficit is capped at 35% of your expenditure. A share of body weight can ask for more than a body your ' +
    'size spends in a day; the pace shown is the one this gives.',
  easingIn:
    'Halfway to maintenance, as you chose: the second step comes in a week. A matter of comfort; it changes nothing about ' +
    'your metabolism.',
  maintenanceCorrection:
    'A gentle pace back toward the weight you are holding, as you chose. Targets return to maintenance once the trend is back ' +
    'in its band.',
  trainingLapsed:
    'The surplus is paused: no workout has been logged for three weeks (or no training days are set), and without ' +
    'training extra calories are stored as fat. Lean-gain targets return at the check-in after you log a workout.',
};

/** What a flag on the targets means, in a sentence or two. */
export const targetFlagMessage = (flag: TargetFlag): string => messages[flag];
