import { useRef } from 'react';
import { HomeDestination } from '../state/HomeDestination';
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
import { showAddFoodSheet } from '../food/showAddFoodSheet';
import { useShownDay } from '../food/useShownDay';
import { MmButton } from '../ui/MmButton';
import { MmFab } from '../ui/MmFab';
import { useOverlays } from '../ui/useOverlays';
import { destinations } from './destinations';
import { Fmt } from '../format/Fmt';
import { SettingsScreen } from '../settings/SettingsScreen';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { useKeptScroll } from './useKeptScroll';
import { useLoaded } from './useLoaded';
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
  const overlays = useOverlays();
  const shownDay = useShownDay();
  const today = useCell(state.today);
  // Before the weigh-in the Dashboard's primary is the row's Save, a fill, so the bar's Add food is a
  // text action; once weighed, Add food is the screen's lead, the one Ember text there is (MM-288).
  const weighedToday = (useLoaded(state.weights) ?? []).some((weight) => weight.date === today);
  // The relief offer brings its own primary to the Dashboard; then Add food is a text action (MM-288, the panel's PD3).
  const offerShown = useCell(state.reliefOffer) !== undefined;
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
        actions={
          <>
            {current === 'dashboard' ? (
              <MmButton
                label="Add food"
                icon="plus"
                kind={weighedToday && !offerShown ? 'lead' : 'text'}
                onPress={() => void showAddFoodSheet(overlays, state.today.peek())}
              />
            ) : null}
            <MmIconButton
              icon="settings"
              label="Settings"
              onPress={() => void navigator.push(() => <SettingsScreen />)}
            />
          </>
        }
      />
      {/* Before the body in the document (MM-286): after the bar, the primary action is the next focus stop, not the last. */}
      {current === 'food' ? (
        <div className="app-fab-anchor">
          <MmFab label="Add food" icon="plus" onPress={() => void showAddFoodSheet(overlays, shownDay)} />
        </div>
      ) : null}
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
