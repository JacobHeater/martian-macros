import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { useNavigator } from '../app/useNavigator';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useSettingsSection } from './useSettingsSection';
import { CoachSettingsScreen } from './CoachSettingsScreen';

/**
 * Settings' Coach section (MM-364): one row that opens the coaching
 * insights' switches, as Pause opens its screen from Today's setup; and the
 * switches for exact targets (MM-123) and easing into maintenance (MM-130),
 * both off by default.
 */
export function CoachSettingsSection() {
  // Folds in place, closed until opened (MM-398).
  const fold = useSettingsSection('coach');
  const navigator = useNavigator();
  const { services, state } = useApp();
  const exact = useLoaded(state.exactTargets) ?? false;
  const ease = useLoaded(state.easeIntoMaintenance) ?? false;
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
