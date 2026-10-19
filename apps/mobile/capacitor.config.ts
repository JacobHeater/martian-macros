import type { CapacitorConfig } from '@capacitor/cli';

// The real identity (MM-8). The dev and demo twins add ".dev" and ".demo"
// in each shell's own build (the Android flavors, the iOS build settings),
// not here: this is what Capacitor's CLI reads, and it is not the build.
const config: CapacitorConfig = {
  appId: 'com.martianmacros',
  appName: 'Martian Macros',
  webDir: 'dist',
};

export default config;
