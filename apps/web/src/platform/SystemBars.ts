/**
 * The phone's own bars around the app: the status bar at the top and the
 * navigation bar at the bottom. The app draws behind them, so their icons
 * have to contrast with the app's background.
 */
export interface SystemBars {
  /** Make the bars' icons readable on a dark or a light background. */
  setBackgroundIsDark(dark: boolean): void;
}
