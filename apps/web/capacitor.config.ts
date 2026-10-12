import type { CapacitorConfig } from '@capacitor/cli';

// Until the React app replaces the Flutter one (MM-228) it installs only
// under the demo identity, so it can never share the normal app's sandbox.
const config: CapacitorConfig = {
  appId: 'com.martianmacros.martian_macros.demo',
  appName: 'Martian Macros DEMO',
  webDir: 'dist',
};

export default config;
