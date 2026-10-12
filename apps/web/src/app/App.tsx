import { useEffect, useMemo } from 'react';
import type { SystemBars } from '../platform/SystemBars';
import type { AppServices } from '../state/AppServices';
import { AppState } from '../state/AppState';
import { Loadable } from '../state/Loadable';
import { isDarkPalette } from '../theme/isDarkPalette';
import { paletteFor } from '../theme/paletteFor';
import { DemoNotice } from '../ui/DemoNotice';
import { MmOverlays } from '../ui/MmOverlays';
import { AppContext } from './AppContext';
import { AppRoot } from './AppRoot';
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
}

/** The app: its state over the stores it is given, its theme, and the screen that is due. */
export function App({ services, systemBars, demo = false }: AppProps) {
  const state = useMemo(() => new AppState(services), [services]);
  const scope = useMemo(() => ({ services, state }), [services, state]);

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

  // The health platform is read when the app opens (MM-68).
  useEffect(() => {
    void state.syncHealth();
  }, [state]);

  // Roll the calendar day over if the app was left open overnight, and
  // read the health platform again when the app comes back to the front.
  useEffect(() => {
    const resumed = () => {
      if (document.visibilityState !== 'visible') return;
      state.refreshToday();
      void state.syncHealth();
    };
    document.addEventListener('visibilitychange', resumed);
    return () => document.removeEventListener('visibilitychange', resumed);
  }, [state]);

  const content = (
    <MmOverlays>
      <NavigatorHost>
        <AppRoot />
      </NavigatorHost>
    </MmOverlays>
  );
  return <AppContext.Provider value={scope}>{demo ? <DemoNotice>{content}</DemoNotice> : content}</AppContext.Provider>;
}
