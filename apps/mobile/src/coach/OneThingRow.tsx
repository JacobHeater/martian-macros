import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { MmListRow } from '../ui/MmListRow';
import { MonthlyReportScreen } from './MonthlyReportScreen';
import { RecoveryCheckInScreen } from './RecoveryCheckInScreen';

/**
 * The one thing to do on the Coach screen (MM-256): the single most useful
 * routine action, as one row under the hero. The recovery check-in when it
 * is due, else a monthly report in its first week; the safeguards (the
 * pause, cautions, the under-eating notice, the relief offer) are outside
 * this rationing and sit above the hero in full. Nothing when nothing is
 * due.
 */
export function OneThingRow() {
  const { state } = useApp();
  const navigator = useNavigator();
  const due = useCell(state.recoveryCheckInDue);
  const periods = useCell(state.reportPeriods);
  const today = useCell(state.today);
  if (due) {
    return (
      <MmListRow
        leadingIcon="heart"
        title="Answer this week’s five questions"
        subtitle="Hunger, energy, sleep, training and mood: what the log and the scale cannot see."
        opens
        onPress={() => void navigator.push(() => <RecoveryCheckInScreen />)}
      />
    );
  }
  const latest = periods[periods.length - 1];
  if (latest !== undefined && latest.readyOn.daysUntil(today) < 7) {
    return (
      <MmListRow
        leadingIcon="report"
        title="Open your monthly report"
        subtitle="What you did, what your body did and what the coach measured."
        opens
        onPress={() => void navigator.push(() => <MonthlyReportScreen index={latest.index} />)}
      />
    );
  }
  return null;
}
