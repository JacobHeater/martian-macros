import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/**
 * MM-725: the Android shell is portrait only, as MM-403 says it is and as
 * the iOS shell is, and its launch screen is the loading screen's sky on a
 * phone of any theme, the same value as the iOS launch screen's. CI builds
 * the shell but runs nothing on it, so this reads the sources.
 */
const manifest = readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const styles = readFileSync('android/app/src/main/res/values/styles.xml', 'utf8');
const launch = readFileSync('android/app/src/main/res/values/launch.xml', 'utf8');
const storyboard = readFileSync('ios/App/App/Base.lproj/LaunchScreen.storyboard', 'utf8');

const activity = (name: string): string => {
  const start = manifest.indexOf(`android:name=".${name}"`);
  expect(start, `${name} is declared`).toBeGreaterThan(-1);
  const open = manifest.lastIndexOf('<activity', start);
  return manifest.slice(open, manifest.indexOf('>', start));
};

it.each(['MainActivity', 'ScanActivity'])('%s is portrait only, as on iOS', (name) => {
  expect(activity(name)).toContain('android:screenOrientation="portrait"');
});

it('the launch screen is the sky of the loading screen, whatever the phone’s theme, as on iOS', () => {
  const sky = /<color name="launch_sky">(#[0-9A-Fa-f]{6})<\/color>/.exec(launch)?.[1];
  expect(sky).toBe('#02010D');
  const theme = styles.slice(styles.indexOf('name="AppTheme.NoActionBarLaunch"'));
  expect(theme).toContain('<item name="windowSplashScreenBackground">@color/launch_sky</item>');
  expect(theme).toContain('<item name="android:windowBackground">@color/launch_sky</item>');
  // The iOS launch screen's background, as the storyboard writes it in sRGB parts of 255.
  const ios = /<color key="backgroundColor" red="([\d.]+)" green="([\d.]+)" blue="([\d.]+)"/.exec(storyboard);
  expect(ios).not.toBeNull();
  const hex = ios!.slice(1, 4).map((part) => Math.round(Number(part) * 255).toString(16).padStart(2, '0').toUpperCase());
  expect(`#${hex.join('')}`).toBe(sky);
});
