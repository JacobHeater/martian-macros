import { useRef } from 'react';
import { HomeDestination } from '../state/HomeDestination';
import { MartianRidge } from '../ui/MartianRidge';
import { MmAppBar } from '../ui/MmAppBar';
import { MmIconButton } from '../ui/MmIconButton';
import { MmNavigationBar } from '../ui/MmNavigationBar';
import { MmPullToRefresh } from '../ui/MmPullToRefresh';
import type { EdgeSide } from '../ui/EdgeSide';
import { useEdgeSwipe } from '../ui/useEdgeSwipe';
import { usePullToRefresh } from '../ui/usePullToRefresh';
import { CoachScreen } from '../coach/CoachScreen';
import { useTargetChangeSummaries } from '../coach/useTargetChangeSummaries';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { FoodDayHeader } from '../food/FoodDayHeader';
import { FoodScreen } from '../food/FoodScreen';
import { TrainScreen } from '../train/TrainScreen';
import { LibraryScreen } from '../library/LibraryScreen';
import { useShownDay } from '../food/useShownDay';
import { destinations } from './destinations';
import { Fmt } from '../format/Fmt';
import { ProfileScreen } from '../settings/ProfileScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { useOverlays } from '../ui/useOverlays';
import type { DrawerChoice } from './DrawerChoice';
import { DrawerMenu } from './DrawerMenu';
import { useApp } from './useApp';
import { useCell } from './useCell';
import { useKeptScroll } from './useKeptScroll';
import { useNavigator } from './useNavigator';
import './app.css';

/**
 * The frame every destination sits in (MM-90, MM-99, MM-667): its name and the
 * menu button above, the four destinations below. The menu is a drawer from
 * the left (MM-704): the destinations again, Profile, the Library (MM-706) and
 * Settings, the last three pushed over the destination the person is on. A swipe in from the right
 * goes to the next destination, from the left to the one before (MM-582).
 * Coach pulled down from its top refreshes (MM-670).
 */
export function HomeShell() {
  const { state } = useApp();
  const navigator = useNavigator();
  const overlays = useOverlays();
  const rawCurrent = useCell(state.homeTab);
  const current: HomeDestination = rawCurrent === 'progress' ? 'coach' : rawCurrent;
  const shownDay = useShownDay();
  const today = useCell(state.today);
  useTargetChangeSummaries();
  // A destination keeps its scroll position across a visit elsewhere (MM-286).
  const body = useRef<HTMLElement>(null);
  const scroll = useKeptScroll(body, current, state.destinationScroll);
  const select = (id: HomeDestination) => {
    scroll.leave(current);
    state.homeTab.put(id);
  };
  const openMenu = async () => {
    const choice = await overlays.drawer<DrawerChoice>('Menu', (close) => <DrawerMenu current={current} onChoose={(chosen) => close(chosen)} />);
    if (choice === undefined) return;
    if (choice === 'profile') void navigator.push(() => <ProfileScreen />);
    else if (choice === 'library') void navigator.push(() => <LibraryScreen />);
    else if (choice === 'settings') void navigator.push(() => <SettingsScreen />);
    else if (choice !== current) select(choice);
  };
  const at = destinations.findIndex((destination) => destination.id === current);
  const beside = (side: EdgeSide) => destinations[side === 'right' ? at + 1 : at - 1];
  const swipe = useEdgeSwipe(
    body,
    (side) => beside(side) !== undefined,
    (side) => {
      const next = beside(side);
      if (next !== undefined) select(next.id);
    },
  );
  // Coach, pulled down from its top, reads everything it shows again (MM-670).
  const pull = usePullToRefresh(body, current === 'coach' ? () => state.refreshCoach() : undefined);
  return (
    <div className="app-frame" {...swipe}>
      <MmAppBar
        // On Food the heading is the day shown, as its stepper says (MM-390).
        title={current === 'food' ? Fmt.day(shownDay, today) : HomeDestination.label(current)}
        titleContent={current === 'food' ? <FoodDayHeader /> : undefined}
        // The menu button at the left opens the drawer (MM-704); the gear it replaces is gone.
        leading={<MmIconButton icon="menu" label="Menu" opens="dialog" onPress={() => void openMenu()} />}
        // No screen has an Add food button: food is added from a meal's "+" on Food (MM-438).
      />
      <main className="app-body" ref={body} {...pull.handlers}>
        <MmPullToRefresh pull={pull.state} />
        {current === 'dashboard' ? (
          <DashboardScreen />
        ) : current === 'food' ? (
          <FoodScreen />
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
        onSelect={select}
      />
    </div>
  );
}
