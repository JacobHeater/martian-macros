import { HardwareBack } from './HardwareBack';
import { DownloadStatusHost } from '../foodPacks/DownloadStatusHost';
import { type ReactNode, useEffect, useMemo } from 'react';
import type { SystemBars } from '../platform/SystemBars';
import type { AppServices } from '../state/AppServices';
import { AppState } from '../state/AppState';
import { Loadable } from '../state/Loadable';
import { isDarkPalette } from '../theme/isDarkPalette';
import { paletteFor } from '../theme/paletteFor';
import { DemoNotice } from '../ui/DemoNotice';
import type { MmFolds } from '../ui/MmFolds';
import { MmFoldsContext } from '../ui/MmFoldsContext';
import { MmOverlays } from '../ui/MmOverlays';
import { AppContext } from './AppContext';
import { AppRoot } from './AppRoot';
import { CrashBoundary } from './CrashBoundary';
import { NavigatorHost } from './NavigatorHost';
import { useCell } from './useCell';
import { usePrefersDark } from './usePrefersDark';
import './app.css';

interface AppProps {
  /** Where everything is stored. The one place that chooses hands them in. */
  services: AppServices;
  /** The phone's bars, told when the background changes. Absent in a browser. */
  systemBars?: SystemBars | undefined;
  /** Marks every screen as showing synthetic data. */
  demo?: boolean;
  /**
   * Drawn beside the app's root, inside everything the app provides. The
   * design register opens a screen from here (MM-237); the app itself
   * passes nothing.
   */
  children?: ReactNode;
}

/** The app: its state over the stores it is given, its theme, and the screen that is due. */
export function App({ services, systemBars, demo = false, children }: AppProps) {
  const state = useMemo(() => new AppState(services), [services]);
  const scope = useMemo(() => ({ services, state }), [services, state]);
  // Folds are kept in the state (MM-286), so a destination finds its sections as they were left.
  const allOpen = useCell(state.foldsAllOpen);
  const folds = useMemo<MmFolds>(
    () => ({
      get: (key) => state.folds.peek().get(key),
      set: (key, expanded) => state.folds.put(new Map(state.folds.peek()).set(key, expanded)),
      allOpen,
    }),
    [state, allOpen],
  );

  const preview = useCell(state.themePreview);
  const stored = useCell(state.themePreference);
  // Until the stored choice has been read the app follows the phone, so an
  // installation that chose Dark is never shown Martian first (MM-186).
  const preference = preview ?? Loadable.valueOf(stored) ?? 'system';
  const palette = paletteFor(preference, usePrefersDark());

  useEffect(() => {
    document.documentElement.className = `theme-${palette}`;
    systemBars?.setBackgroundIsDark(isDarkPalette(palette));
  }, [palette, systemBars]);

  // Once the store holds a real choice, what was being tried is the choice (MM-185).
  useEffect(() => {
    if (stored.ready && stored.value !== 'unselected') state.themePreview.put(undefined);
  }, [stored, state]);

  // The check-in runs for as long as the app is open, whatever screen is showing.
  useEffect(() => state.checkIn.start(), [state]);

  // Reminders follow the plan for as long as the app is open (MM-146).
  useEffect(() => state.keepRemindersScheduled(), [state]);

  // The coach's announcement log is written once a day for as long as the app is open (MM-605).
  useEffect(() => state.coachAnalysis.keepAnnouncing(), [state]);

  // The health platform is read when the app opens (MM-68), always (MM-72).
  useEffect(() => {
    void state.syncHealth('opened');
  }, [state]);

  // Roll the calendar day over if the app was left open overnight, and
  // read the health platform again when the app comes back to the front,
  // unless it was read only minutes ago (MM-72).
  useEffect(() => {
    const resumed = () => {
      if (document.visibilityState !== 'visible') return;
      state.refreshToday();
      void state.syncHealth('resumed');
    };
    document.addEventListener('visibilitychange', resumed);
    return () => document.removeEventListener('visibilitychange', resumed);
  }, [state]);

  // A crash while drawing any of this is said in words, with the theme on (MM-679), never a blank screen.
  const content = (
    <CrashBoundary>
      <MmOverlays>
        <DownloadStatusHost>
          <NavigatorHost>
            <HardwareBack />
            <AppRoot />
            {children}
          </NavigatorHost>
        </DownloadStatusHost>
      </MmOverlays>
    </CrashBoundary>
  );
  return (
    <AppContext.Provider value={scope}>
      <MmFoldsContext.Provider value={folds}>{demo ? <DemoNotice>{content}</DemoNotice> : content}</MmFoldsContext.Provider>
    </AppContext.Provider>
  );
}
