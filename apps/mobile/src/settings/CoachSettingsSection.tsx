import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useCell } from '../app/useCell';
import { CarbFatBalance } from '../domain/CarbFatBalance';
import { TargetShape } from '../domain/TargetShape';
import { weekdayLabel } from '../format/weekdayLabel';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { useSettingsSection } from './useSettingsSection';
import { CarbFatBalanceScreen } from './CarbFatBalanceScreen';
import { CoachSettingsScreen } from './CoachSettingsScreen';
import { WeekShapeScreen } from './WeekShapeScreen';

/**
 * Settings' Coach section (MM-364): one row that opens the coaching
 * insights' switches, as Pause opens its screen from Today's setup; and the
 * switches for exact targets (MM-123) and easing into maintenance (MM-130),
 * both off by default; and the rows that open the balance of carbs and fat
 * (MM-122) and the week's shape (MM-124).
 */
export function CoachSettingsSection() {
  // Folds in place, closed until opened (MM-398).
  const fold = useSettingsSection('coach');
  const navigator = useNavigator();
  const { services, state } = useApp();
  const exact = useLoaded(state.exactTargets) ?? false;
  const ease = useLoaded(state.easeIntoMaintenance) ?? false;
  const shape = TargetShape.on(useLoaded(state.targetShapes) ?? [], useCell(state.today));
  const fatShare = shape?.balance?.fatShare ?? CarbFatBalance.issuedFatShare;
  const balanceName =
    fatShare === CarbFatBalance.moreCarbsFatShare
      ? 'More carbs'
      : fatShare === CarbFatBalance.balancedFatShare
        ? 'Balanced'
        : fatShare === CarbFatBalance.moreFatFatShare
          ? 'More fat'
          : `Fat ${roundHalfAwayFromZero(fatShare * 100)}% of calories`;
  const higherDays = [1, 2, 3, 4, 5, 6, 0].filter((day) => shape?.week.higherDays.has(day) === true);
  return (
    <MmSection icon="coach" title="Coach" {...fold}>
      <MmListGroup>
        <MmListRow
          leadingIcon="insight"
          title="Coaching insights"
          subtitle="Insights under the things you log, by area and by kind."
          opens
          onPress={() => void navigator.push(() => <CoachSettingsScreen />)}
        />
        <MmListRow
          leadingIcon="percent"
          title="Carbs and fat balance"
          subtitle={shape?.balance === undefined ? 'Fat 25% of calories, as the app set it. Yours to choose.' : balanceName}
          opens
          onPress={() => void navigator.push(() => <CarbFatBalanceScreen />)}
        />
        <MmListRow
          leadingIcon="calendar"
          title="Week shape"
          subtitle={
            higherDays.length === 0
              ? 'Off: every day has the same target.'
              : `${higherDays.map(weekdayLabel).join(', ')} ${roundHalfAwayFromZero((shape?.week.raise ?? 0) * 100)}% higher.`
          }
          opens
          onPress={() => void navigator.push(() => <WeekShapeScreen />)}
        />
        <MmSwitchRow
          leadingIcon="tune"
          title="Exact targets"
          subtitle="Show targets to the calorie and the gram. Off, they are rounded to 25 kcal and 5 g; the coach works from the exact figures either way."
          value={exact}
          onChange={(value) => void services.preferences.saveExactTargets(value)}
        />
        <MmSwitchRow
          leadingIcon="flag"
          title="Ease into maintenance"
          subtitle="Leaving a deficit, raise calories in two equal steps over two weeks instead of at once. A matter of comfort; it changes nothing about your metabolism."
          value={ease}
          onChange={(value) => void services.preferences.saveEaseIntoMaintenance(value)}
        />
      </MmListGroup>
    </MmSection>
  );
}
