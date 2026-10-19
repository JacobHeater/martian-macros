import { useNavigator } from '../app/useNavigator';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSection } from '../ui/MmSection';
import { useSettingsSection } from './useSettingsSection';
import { CoachSettingsScreen } from './CoachSettingsScreen';

/**
 * Settings' Coach section (MM-364): one row that opens the coaching
 * insights' switches, as Pause opens its screen from Today's setup.
 */
export function CoachSettingsSection() {
  // Folds in place, closed until opened (MM-398).
  const fold = useSettingsSection('coach');
  const navigator = useNavigator();
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
      </MmListGroup>
    </MmSection>
  );
}
