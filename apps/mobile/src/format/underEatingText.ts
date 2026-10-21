import type { UnderEatingFinding } from '../engine';
import { Fmt } from './Fmt';

/**
 * The under-eating notice's words (MM-114): what was seen, the innocent
 * explanation and its fix first, then the other one. Nothing is praised and
 * nobody is told what they have.
 *
 * With `weightLossMedication` (MM-113), two lines for the prescriber come
 * before the support line: low appetite is expected, and food or fluids that
 * will not stay down need the prescriber soon. Wording pending MM-29.
 */
export function underEatingText(
  f: UnderEatingFinding,
  { supportLine, weightLossMedication = false }: { supportLine: boolean; weightLossMedication?: boolean },
): string {
  const lines = [
    `Your logged days average ${Fmt.whole(f.averageKcal)} kcal. The lowest the ` +
      `app would ever suggest for you is ${Fmt.whole(f.floorKcal)}.`,
    'If those days are missing food, mark them partial.',
    'If they are complete, that is less than the app considers enough. Eating ' +
      'at your target will not slow your progress the way it feels like it ' +
      'will.',
  ];
  if (weightLossMedication) {
    lines.push(
      'Low appetite on this medication is common. If you often can’t reach the minimum, tell your prescriber.',
      'If you can’t keep food or fluids down, contact your prescriber promptly.',
    );
  }
  if (supportLine) {
    lines.push(
      'If eating has become a source of distress, a doctor or a registered ' +
        'dietitian is the right person to talk to.',
    );
  }
  return lines.join(' ');
}
