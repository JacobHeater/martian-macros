import { useState } from 'react';
import type { ThemePreference } from '../domain/ThemePreference';
import { themePreferenceLabel } from '../format/themePreferenceLabel';
import { themeChoices } from '../theme/themeChoices';
import { useApp } from '../app/useApp';
import { useLoaded } from '../app/useLoaded';
import { MmChoiceChip } from '../ui/MmChoiceChip';
import { Notice } from '../ui/Notice';

/** How the app looks (MM-165, MM-184): chosen here, applied at once and kept. */
export function ThemeSettings() {
  const { services, state } = useApp();
  const preference = useLoaded(state.themePreference);
  const selected = preference === 'unselected' ? 'martian' : preference;
  const [error, setError] = useState<string>();

  const choose = async (choice: ThemePreference) => {
    setError(undefined);
    try {
      await services.preferences.saveThemePreference(choice);
    } catch {
      setError('Could not save your theme. Please try again.');
    }
  };

  return (
    <>
      <div className="app-row" role="group" aria-label="Appearance">
        {themeChoices.map((choice) => (
          <MmChoiceChip
            key={choice}
            label={themePreferenceLabel(choice)}
            selected={choice === selected}
            onSelect={() => void choose(choice)}
          />
        ))}
      </div>
      {error === undefined ? null : <Notice kind="caution" text={error} />}
    </>
  );
}
