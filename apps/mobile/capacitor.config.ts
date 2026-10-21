import type { CapacitorConfig } from '@capacitor/cli';

// The real identity (MM-8). The dev and demo twins add ".dev" and ".demo"
// in each shell's own build (the Android flavors, the iOS build settings),
// not here: this is what Capacitor's CLI reads, and it is not the build.
const config: CapacitorConfig = {
  appId: 'com.martianmacros',
  appName: 'Martian Macros',
  webDir: 'dist',
  // The web view's ground before the page paints (MM-109): Martian's canvas,
  // the default palette, the same as the launch screen, so the start does not
  // flash. test/shell/launchScreen.test.ts holds them equal.
  backgroundColor: '#110c35',
};

export default config;
