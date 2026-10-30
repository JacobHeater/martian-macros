import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { Screen } from './Screen';
import { openSettingsSection } from '../settings/openSettingsSection';
import { useNavigator } from './useNavigator';

/**
 * Shown when the stored date of birth makes the user under 18. Coaching
 * stops; the date can be corrected in Settings (MM-83, MM-13).
 */
export function AdultsOnlyScreen() {
  const navigator = useNavigator();
  return (
    <Screen roomy>
      <div className="app-centered">
        <h1 className="app-headline">Martian Macros is for adults</h1>
        <Notice
          kind="caution"
          icon="close"
          text={
            'Martian Macros is for adults 18 and over. Growing bodies ' +
            'need different guidance than this app provides. Coaching ' +
            'is switched off.'
          }
        />
        <div className="app-gap" />
        <MmButton
          label="Correct date of birth"
          kind="secondary"
          expand
          // The date of birth is under "You", on Profile: that section opens (MM-398, MM-705, the UX role's UX-2).
          onPress={() => void openSettingsSection(navigator, 'profile')}
        />
      </div>
    </Screen>
  );
}
