import { SystemBars as NativeBars, SystemBarsStyle } from '@capacitor/core';
import type { SystemBars } from './SystemBars';

/** The system bars through the native shell. In a browser it does nothing. */
export class CapacitorSystemBars implements SystemBars {
  setBackgroundIsDark(dark: boolean): void {
    // "Dark" is the style for a dark background: light icons.
    const style = dark ? SystemBarsStyle.Dark : SystemBarsStyle.Light;
    // A refusal leaves the bars as they were; there is nothing to recover.
    void NativeBars.setStyle({ style }).catch(() => undefined);
  }
}
