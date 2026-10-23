import type { Overlays } from '../ui/Overlays';
import type { EasyToMissAnswer } from './EasyToMissAnswer';
import { EasyToMissSheet } from './EasyToMissSheet';

/** Asks the easy-to-miss check (MM-575); undefined when it is closed unanswered. */
export function showEasyToMissSheet(overlays: Overlays): Promise<EasyToMissAnswer | undefined> {
  return overlays.sheet<EasyToMissAnswer>('Anything easy to miss?', (close) => <EasyToMissSheet onAnswer={(answer) => close(answer)} />);
}
