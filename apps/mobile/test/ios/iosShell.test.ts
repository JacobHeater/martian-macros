import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * MM-403: the iOS shell. CI builds no iOS app, so this reads its source:
 * every Kotlin plugin the Android shell registers has a Swift twin of the
 * same name, registered from `MainViewController`, built in the app target
 * and offering every method the Kotlin one does; the deployment target is
 * iOS 15; the app is portrait only; and the purpose strings are there.
 */
const read = (path: string) => readFileSync(path, 'utf8');
const androidDir = 'android/app/src/main/java/com/martianmacros';
const pluginsDir = 'ios/App/App/Plugins';
const mainActivity = read(`${androidDir}/MainActivity.java`);
const mainViewController = read('ios/App/App/MainViewController.swift');
const project = read('ios/App/App.xcodeproj/project.pbxproj');
const plist = read('ios/App/App/Info.plist');

const androidPlugins = [...mainActivity.matchAll(/registerPlugin\((\w+)\.class\)/g)].map((m) => m[1]);

it('the Android shell registers the plugins this test checks', () => {
  expect(androidPlugins).toEqual(['MmDbPlugin', 'MmPacksPlugin', 'MmRemindersPlugin', 'MmScannerPlugin', 'MmHealthPlugin', 'MmBackupPlugin', 'MmTransferPlugin']);
});

describe.each(androidPlugins)('%s', (plugin) => {
  const kotlin = read(`${androidDir}/${plugin}.kt`);
  const swift = read(`${pluginsDir}/${plugin}.swift`);

  it('answers to the same name on both platforms', () => {
    const name = /@CapacitorPlugin\(\s*name = "(\w+)"/.exec(kotlin)?.[1];
    expect(name).toBeDefined();
    expect(swift).toContain(`public let jsName = "${name}"`);
  });

  it('is registered when the bridge loads', () => {
    expect(mainViewController).toContain(`bridge?.registerPluginInstance(${plugin}())`);
  });

  it('offers every method of its Kotlin twin', () => {
    const methods = [...kotlin.matchAll(/@PluginMethod\s+fun (\w+)\(/g)].map((m) => m[1]);
    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) {
      expect(swift).toContain(`CAPPluginMethod(name: "${method}", returnType: CAPPluginReturnPromise)`);
      expect(swift).toMatch(new RegExp(`@objc func ${method}\\(`));
    }
  });
});

it('builds every Swift file of the shell in the app target', () => {
  const sources = readdirSync(pluginsDir).filter((file) => file.endsWith('.swift'));
  for (const file of [...sources, 'AppDelegate.swift', 'SceneDelegate.swift', 'MainViewController.swift']) {
    expect(project).toContain(`/* ${file} in Sources */,`);
  }
});

it('supports iOS 15 and later, in portrait', () => {
  const targets = new Set([...project.matchAll(/IPHONEOS_DEPLOYMENT_TARGET = ([\d.]+);/g)].map((m) => m[1]));
  expect([...targets]).toEqual(['15.0']);
  const orientations = /<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/.exec(plist)?.[1] ?? '';
  expect([...orientations.matchAll(/<string>(\w+)<\/string>/g)].map((m) => m[1])).toEqual(['UIInterfaceOrientationPortrait']);
});

it('says the local network is for moving to another phone (MM-695)', () => {
  const why = /<key>NSLocalNetworkUsageDescription<\/key>\s*<string>([^<]+)<\/string>/.exec(plist)?.[1] ?? '';
  expect(why).toMatch(/Move to another phone/);
  expect(why).toMatch(/Nothing goes to the internet/);
});

it('says why it uses the camera and Apple Health', () => {
  for (const key of ['NSCameraUsageDescription', 'NSHealthShareUsageDescription']) {
    expect(plist).toMatch(new RegExp(`<key>${key}</key>\\s*<string>[^<]+</string>`));
  }
});
