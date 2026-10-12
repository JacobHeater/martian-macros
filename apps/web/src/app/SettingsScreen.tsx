import type { ThemePreference } from '../theme/ThemePreference';
import { MmAppBar } from '../ui/MmAppBar';
import { MmButton } from '../ui/MmButton';
import { MmIconButton } from '../ui/MmIconButton';
import './app.css';

const CHOICES: readonly { preference: ThemePreference; label: string }[] = [
  { preference: 'martian', label: 'Martian' },
  { preference: 'light', label: 'Light' },
  { preference: 'dark', label: 'Dark' },
  { preference: 'system', label: 'System' },
];

interface SettingsScreenProps {
  theme: ThemePreference;
  onTheme: (preference: ThemePreference) => void;
  onBack: () => void;
}

/** Settings, so far only how the app looks (MM-165, MM-184). */
export function SettingsScreen({ theme, onTheme, onBack }: SettingsScreenProps) {
  return (
    <div className="app-frame">
      <MmAppBar title="Settings" leading={<MmIconButton icon="back" label="Back" onPress={onBack} />} />
      <main className="app-body">
        <h2 className="app-group-header">Appearance</h2>
        <div className="app-row" role="group" aria-label="Appearance">
          {CHOICES.map((choice) => (
            <MmButton
              key={choice.preference}
              label={choice.preference === theme ? `${choice.label} (chosen)` : choice.label}
              kind={choice.preference === theme ? 'primary' : 'secondary'}
              onPress={() => onTheme(choice.preference)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
