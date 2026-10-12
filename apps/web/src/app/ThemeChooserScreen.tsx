import { useState } from 'react';
import type { ThemePreference } from '../domain/ThemePreference';
import { themePreferenceLabel } from '../format/themePreferenceLabel';
import { themeChoices } from '../theme/themeChoices';
import { ChoiceCard } from '../ui/ChoiceCard';
import { MacroBar } from '../ui/MacroBar';
import { MacroKind } from '../ui/MacroKind';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';
import { Screen } from './Screen';
import { useApp } from './useApp';
import { useCell } from './useCell';

const details: Readonly<Record<ThemePreference, string>> = {
  martian: 'Acid lime, cyan and pink on deep grape.',
  light: 'Cool gray, white and crisp ink.',
  dark: 'Midnight blue with warm orange accents.',
  system: "Follow your phone's light or dark appearance.",
  unselected: "Follow your phone's light or dark appearance.",
};

/**
 * The first screen of a new installation (MM-184): the app opens in
 * Martian, shows the other looks as they are chosen, and saves none of
 * them until Continue.
 */
export function ThemeChooserScreen() {
  const { services, state } = useApp();
  const selected = useCell(state.themePreview) ?? 'martian';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await services.preferences.saveThemePreference(selected);
    } catch {
      setError('Could not save your theme. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen roomy>
      <h1 className="app-headline">Make it your planet.</h1>
      <h2 className="app-headline">Choose your theme</h2>
      <p className="app-text">Martian is our retro original. Try a look below; you can change it anytime in Settings.</p>
      <div className="app-gap" />
      {themeChoices.map((choice) => (
        <ChoiceCard
          key={choice}
          label={themePreferenceLabel(choice)}
          detail={details[choice]}
          badge={choice === 'martian' ? 'Default' : undefined}
          selected={selected === choice}
          onPress={() => {
            if (!saving) state.themePreview.put(choice);
          }}
        />
      ))}
      <h3 className="app-subhead">A little color preview</h3>
      {MacroKind.values.map((macro) => (
        <div key={macro} className="app-stack-item">
          <MacroBar grams={65} target={100} macro={macro} />
        </div>
      ))}
      {error === undefined ? null : <Notice kind="caution" text={error} />}
      <div className="app-gap" />
      <MmButton label={saving ? 'Saving…' : 'Continue'} expand onPress={saving ? undefined : () => void confirm()} />
    </Screen>
  );
}
