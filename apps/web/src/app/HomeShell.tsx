import { HomeDestination } from '../state/HomeDestination';
import { MmAppBar } from '../ui/MmAppBar';
import { MmIconButton } from '../ui/MmIconButton';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import { MmSurface } from '../ui/MmSurface';
import { destinations } from './destinations';
import { SettingsScreen } from './SettingsScreen';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { useNavigator } from './useNavigator';
import './app.css';

/**
 * The frame every destination sits in (MM-90, MM-99): its name and the way
 * to Settings above, the five destinations below. A destination that is
 * not rebuilt yet says so.
 */
export function HomeShell() {
  const { state } = useApp();
  const navigator = useNavigator();
  const current = useCell(state.homeTab);
  return (
    <div className="app-frame">
      <MmAppBar
        title={current === 'dashboard' || current === 'food' ? 'Today' : HomeDestination.label(current)}
        actions={
          <MmIconButton
            icon="settings"
            label="Settings"
            onPress={() => void navigator.push(() => <SettingsScreen />)}
          />
        }
      />
      <main className="app-body">
        <MmSurface>
          <p className="app-empty">{HomeDestination.label(current)} is not rebuilt yet.</p>
        </MmSurface>
      </main>
      <MmNavigationBar destinations={destinations} current={current} onSelect={(id) => state.homeTab.put(id)} />
    </div>
  );
}
