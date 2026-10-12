import type { Fmt } from '../format/Fmt';
import { recompSignalText } from '../format/recompSignalText';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { InfoCard } from '../ui/InfoCard';

/**
 * The recomp signal (MM-32): shown while trend weight is flat, the waist
 * is down and strength is up over four weeks, in any goal, since it says
 * what happened and not what was meant. With one of the three not logged
 * it says what logging it would show. Otherwise it takes no room.
 */
export function RecompSignalCard({ fmt }: { fmt: Fmt }) {
  const { state } = useApp();
  const signal = useCell(state.recompSignal);
  const text = signal === undefined ? undefined : recompSignalText(signal, fmt);
  if (signal === undefined || text === undefined) return null;
  return (
    <InfoCard title={signal.present ? 'Recomp signal' : 'Close to a recomp signal'}>
      <p className="app-text">{text}</p>
    </InfoCard>
  );
}
