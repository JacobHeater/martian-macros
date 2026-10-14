import { useState } from 'react';
import type { ThemePreference } from '../domain/ThemePreference';
import { themePreferenceLabel } from '../format/themePreferenceLabel';
import { themeChoices } from '../theme/themeChoices';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
import { Notice } from '../ui/Notice';
import { useOverlays } from '../ui/useOverlays';

/**
 * How the app looks (MM-165, MM-184): one row with the look in force, which
 * opens the chooser (MM-259); the choice applies at once and is kept.
 */
export function ThemeSettings() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const preference = useLoaded(state.themePreference);
  const selected = preference === 'unselected' || preference === undefined ? 'martian' : preference;
  const [error, setError] = useState<string>();

  const choose = async () => {
    const chosen = await overlays.options<ThemePreference>({
      title: 'Appearance',
      options: themeChoices.map((choice) => ({ value: choice, label: themePreferenceLabel(choice) })),
      selected,
    });
    if (chosen === undefined) return;
    setError(undefined);
    try {
      await services.preferences.saveThemePreference(chosen.value);
    } catch {
      setError('Could not save your theme. Please try again.');
    }
  };

  return (
    <>
      <MmListRow
        leadingIcon="palette"
        title="Appearance"
        subtitle={themePreferenceLabel(selected)}
        trailingAction={<MmIconButton icon="edit" label="Change appearance" opens="listbox" onPress={() => void choose()} />}
      />
      {error === undefined ? null : <Notice kind="caution" text={error} />}
    </>
  );
}
