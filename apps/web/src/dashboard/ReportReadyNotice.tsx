import { MonthlyReportScreen } from '../coach/MonthlyReportScreen';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { useNavigator } from '../app/useNavigator';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * A line when a monthly report has just become ready (MM-33): for a week
 * after it does. No count, no pressure; the reports stay on the Coach
 * screen.
 */
export function ReportReadyNotice() {
  const { state } = useApp();
  const navigator = useNavigator();
  const periods = useCell(state.reportPeriods);
  const today = useCell(state.today);
  const latest = periods[periods.length - 1];
  if (latest === undefined || latest.readyOn.daysUntil(today) >= 7) return null;
  return (
    <div className="app-stack-item">
      <Notice
        icon="history"
        title={latest.index === 0 ? 'Your first month is done' : 'A new monthly report is ready'}
        text="See what you did, what your body did and what the coach measured."
        action={
          <MmButton
            label="Open the report"
            kind="secondary"
            onPress={() => void navigator.push(() => <MonthlyReportScreen index={latest.index} />)}
          />
        }
      />
    </div>
  );
}
