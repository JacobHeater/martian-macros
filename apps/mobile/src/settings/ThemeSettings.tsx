import type { ThemePreference } from '../domain/ThemePreference';
import { themePreferenceLabel } from '../format/themePreferenceLabel';
import { themeChoices } from '../theme/themeChoices';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmIconButton } from '../ui/MmIconButton';
import { MmListRow } from '../ui/MmListRow';
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

  const choose = async () => {
    const chosen = await overlays.options<ThemePreference>({
      title: 'Appearance',
      options: themeChoices.map((choice) => ({ value: choice, label: themePreferenceLabel(choice) })),
      selected,
    });
    if (chosen === undefined) return;
    await save(chosen.value);
  };

  // A failed change is said as Settings says one, in a snack outside the rows (MM-347).
  const save = async (theme: ThemePreference): Promise<void> => {
    try {
      await services.preferences.saveThemePreference(theme);
    } catch {
      overlays.snack('Your appearance could not be saved. Nothing was changed.', {
        label: 'Try again',
        onAction: () => void save(theme),
      });
    }
  };

  return (
    <MmListRow
      leadingIcon="palette"
      title="Appearance"
      subtitle={themePreferenceLabel(selected)}
      trailingAction={<MmIconButton icon="edit" label="Change appearance" opens="listbox" onPress={() => void choose()} />}
    />
  );
}
