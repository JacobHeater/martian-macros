import type { MoveIdentity } from '../transfer/MoveIdentity';
import type { MoveProblem } from '../transfer/MoveProblem';

/** The parts of a version as numbers, "1.4 (12)" as [1, 4, 12], to tell which phone runs the older one. */
const parts = (app: string) => (app.match(/\d+/g) ?? []).map(Number);

/** Which phone runs the older app: -1 this one, 1 the other, 0 when they cannot be told apart. */
function older(here: MoveIdentity, other: MoveIdentity): number {
  if (here.schema !== other.schema) return here.schema < other.schema ? -1 : 1;
  const a = parts(here.app);
  const b = parts(other.app);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}

/**
 * What a move that did not happen says (MM-695), on either phone: what went wrong and what to do, and that nothing
 * on this phone changed. For different versions it names the phone to update, or both when it cannot tell.
 */
export function moveProblemWords(problem: MoveProblem, here: MoveIdentity, side: 'send' | 'receive'): string {
  switch (problem.kind) {
    case 'noWifi':
      return 'This phone is not on Wi-Fi. Join the same Wi-Fi as your other phone, then try again.';
    case 'unreachable':
      return 'Could not reach the other phone. Both phones need the same Wi-Fi, and the other phone must still show its code.';
    case 'versionMismatch': {
      const which = problem.other === undefined ? 0 : older(here, problem.other);
      const advice =
        which < 0
          ? 'Update Martian Macros on this phone, then try again.'
          : which > 0
            ? 'Update Martian Macros on the other phone, then try again.'
            : 'Update Martian Macros on both phones to the same version, then try again.';
      return `The two phones run different versions of Martian Macros. ${advice}`;
    }
    case 'stopped':
      return 'The code expired. Show a new one when your other phone is ready to scan it.';
    case 'notACode':
      return 'That is not a Martian Macros move code. On your other phone, choose Receive on this phone, then scan the code it shows.';
    case 'broken':
      return side === 'send'
        ? 'The move stopped before it finished. Nothing on either phone was changed.'
        : 'The move stopped before it finished. Nothing on this phone was changed.';
  }
}
