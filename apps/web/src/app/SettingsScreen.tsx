import { useState } from 'react';
import type { ThemePreference } from '../domain/ThemePreference';
import { themePreferenceLabel } from '../format/themePreferenceLabel';
import { Loadable } from '../state/Loadable';
import { themeChoices } from '../theme/themeChoices';
import { PauseScreen } from '../pause/PauseScreen';
import { GroupHeader } from '../ui/GroupHeader';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { MmIcon } from '../ui/MmIcon';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { Notice } from '../ui/Notice';
import { Screen } from './Screen';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { useNavigator } from './useNavigator';

/** Settings, so far how the app looks (MM-165, MM-184) and pausing (MM-148). The rest is not rebuilt yet. */
export function SettingsScreen() {
  const { services, state } = useApp();
  const navigator = useNavigator();
  const theme = Loadable.valueOf(useCell(state.themePreference)) ?? 'system';
  const [error, setError] = useState<string>();

  const choose = async (preference: ThemePreference) => {
    setError(undefined);
    try {
      await services.preferences.saveThemePreference(preference);
    } catch {
      setError('Could not save your theme. Please try again.');
    }
  };

  return (
    <Screen title="Settings">
      <GroupHeader text="Appearance" />
      <div className="app-row" role="group" aria-label="Appearance">
        {themeChoices.map((choice) => (
          <MmChoiceChip
            key={choice}
            label={themePreferenceLabel(choice)}
            selected={choice === theme}
            onSelect={() => void choose(choice)}
          />
        ))}
      </div>
      {error === undefined ? null : <Notice kind="caution" text={error} />}
      <GroupHeader text="Coaching" />
      <MmListGroup>
        <MmListRow
          leadingIcon="pause"
          title="Pause"
          subtitle="For a holiday, an illness or an injury."
          trailing={<MmIcon name="chevronRight" />}
          onPress={() => void navigator.push(() => <PauseScreen />)}
        />
      </MmListGroup>
    </Screen>
  );
}
