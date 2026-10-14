import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { InfoCard } from '../ui/InfoCard';
import { MmListRow } from '../ui/MmListRow';
import { MonthlyReportScreen } from './MonthlyReportScreen';

/**
 * Every monthly report that is ready, newest first, each reopenable
 * (MM-33). Empty until the first 28 days are over.
 */
export function ReportsCard() {
  const { state } = useApp();
  const navigator = useNavigator();
  const periods = useCell(state.reportPeriods);
  if (periods.length === 0) return null;
  return (
    <InfoCard title="Monthly reports">
      {[...periods].reverse().map((period) => (
        <MmListRow
          key={period.index}
          dense
          title={`${Fmt.shortDay(period.from)} – ${Fmt.shortDay(period.to)}`}
          opens
          onPress={() => void navigator.push(() => <MonthlyReportScreen index={period.index} />)}
        />
      ))}
    </InfoCard>
  );
}
