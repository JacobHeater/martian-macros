import type { RecompPart } from '../engine/RecompPart';
import type { Fmt } from '../format/Fmt';
import { recompSignalText } from '../format/recompSignalText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import type { MmIconName } from '../ui/MmIconName';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmStatusChip } from '../ui/MmStatusChip';

/** Each of the three things, by mark and word: never by colour alone. */
const marks: Readonly<Record<RecompPart, { icon: MmIconName; word: string }>> = {
  holds: { icon: 'checkCircle', word: 'Seen' },
  doesNotHold: { icon: 'close', word: 'Not seen' },
  unknown: { icon: 'dayUnmarked', word: 'Not logged enough' },
};

/**
 * The recomp signal (MM-32): shown while trend weight is flat, the waist
 * is down and strength is up over four weeks, in any goal, since it says
 * what happened and not what was meant. With one of the three not logged
 * it says what logging it would show. Otherwise it takes no room. A
 * section with the insight icon (MM-257). Above the words, the three things
 * it rests on, each seen, not seen or not logged enough, by mark and word
 * (MM-578).
 */
export function RecompSignalCard({ fmt }: { fmt: Fmt }) {
  const { state } = useApp();
  const signal = useCell(state.recompSignal);
  const text = signal === undefined ? undefined : recompSignalText(signal, fmt);
  if (signal === undefined || text === undefined) return null;
  return (
    <MmSection icon="insight" title={signal.present ? 'Recomp signal' : 'Close to a recomp signal'}>
      {(
        [
          ['Trend weight flat', signal.weight],
          ['Waist down', signal.waist],
          ['Strength up', signal.strength],
        ] as const
      ).map(([title, part]) => (
        <MmListRow key={title} dense leadingIcon={marks[part].icon} title={title} trailing={<MmStatusChip label={marks[part].word} />} />
      ))}
      <p className="app-text">{text}</p>
    </MmSection>
  );
}
