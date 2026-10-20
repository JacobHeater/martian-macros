import { Fmt } from '../format/Fmt';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MonthlyReportScreen } from './MonthlyReportScreen';

/**
 * Every monthly report that is ready, newest first, each reopenable
 * (MM-33), as a section that is open in the week a report arrives and
 * folded to its count otherwise (MM-256). Empty until the first 28 days
 * are over.
 */
export function ReportsCard() {
  const { state } = useApp();
  const navigator = useNavigator();
  const periods = useCell(state.reportPeriods);
  const today = useCell(state.today);
  if (periods.length === 0) return null;
  const latest = periods[periods.length - 1];
  const fresh = latest !== undefined && latest.readyOn.daysUntil(today) < 7;
  return (
    <MmSection
      icon="report"
      title="Monthly reports"
      summary={`${periods.length} ${periods.length === 1 ? 'report' : 'reports'}, newest ${Fmt.shortDay(latest!.from)} – ${Fmt.shortDay(latest!.to)}`}
      collapsible
      remember={`coach.reports.${latest?.index ?? 0}`}
      initiallyExpanded={fresh}
    >
      {[...periods].reverse().map((period) => (
        <MmListRow
          key={period.index}
          dense
          leadingIcon="document"
          title={`${Fmt.shortDay(period.from)} – ${Fmt.shortDay(period.to)}`}
          opens
          onPress={() => void navigator.push(() => <MonthlyReportScreen index={period.index} />)}
        />
      ))}
    </MmSection>
  );
}
