import { useRef } from 'react';
import { HomeDestination } from '../state/HomeDestination';
import { MartianRidge } from '../ui/MartianRidge';
import { MmAppBar } from '../ui/MmAppBar';
import { MmIconButton } from '../ui/MmIconButton';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import { CoachScreen } from '../coach/CoachScreen';
import { useTargetChangeSummaries } from '../coach/useTargetChangeSummaries';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { FoodDayHeader } from '../food/FoodDayHeader';
import { FoodScreen } from '../food/FoodScreen';
import { ProgressScreen } from '../progress/ProgressScreen';
import { TrainScreen } from '../train/TrainScreen';
import { useShownDay } from '../food/useShownDay';
import { destinations } from './destinations';
import { Fmt } from '../format/Fmt';
import { SettingsScreen } from '../settings/SettingsScreen';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { useKeptScroll } from './useKeptScroll';
import { useNavigator } from './useNavigator';
import './app.css';

/**
 * The frame every destination sits in (MM-90, MM-99): its name and the way
 * to Settings above, the five destinations below.
 */
export function HomeShell() {
  const { state } = useApp();
  const navigator = useNavigator();
  const current = useCell(state.homeTab);
  const shownDay = useShownDay();
  const today = useCell(state.today);
  useTargetChangeSummaries();
  // A destination keeps its scroll position across a visit elsewhere (MM-286).
  const body = useRef<HTMLElement>(null);
  const scroll = useKeptScroll(body, current, state.destinationScroll);
  return (
    <div className="app-frame">
      <MmAppBar
        // On Food the heading is the day shown, as its stepper says (MM-390).
        title={current === 'food' ? Fmt.day(shownDay, today) : HomeDestination.label(current)}
        titleContent={current === 'food' ? <FoodDayHeader /> : undefined}
        // No screen has an Add food button: food is added from a meal's "+" on Food (MM-438).
        actions={
          <MmIconButton
            icon="settings"
            label="Settings"
            onPress={() => void navigator.push(() => <SettingsScreen />)}
          />
        }
      />
      <main className="app-body" ref={body}>
        {current === 'dashboard' ? (
          <DashboardScreen />
        ) : current === 'food' ? (
          <FoodScreen />
        ) : current === 'progress' ? (
          <ProgressScreen />
        ) : current === 'train' ? (
          <TrainScreen />
        ) : (
          <CoachScreen />
        )}
        <MartianRidge />
      </main>
      <MmNavigationBar
        destinations={destinations}
        current={current}
        onSelect={(id) => {
          scroll.leave(current);
          state.homeTab.put(id);
        }}
      />
    </div>
  );
}
