import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { phoneScreenshotCommands } from '../src/phoneScreenshotCommands.ts';

/**
 * MM-536: CI builds no iOS, so this reads the Swift. The screenshot plugin
 * is registered only in the dev and demo apps, never the real one; it is
 * in the app target's sources; and it answers the names the runner sends.
 */
const shell = (path: string) => readFileSync(new URL(`../../apps/mobile/ios/App/${path}`, import.meta.url), 'utf8');
const plugin = shell('App/Plugins/MmScreenshotPlugin.swift');

test('the plugin is registered only behind its dev-only check', () => {
  const main = shell('App/MainViewController.swift');
  assert.match(main, /if MmScreenshotPlugin\.isAllowed \{\s*bridge\?\.registerPluginInstance\(MmScreenshotPlugin\(\)\)\s*\}/);
  assert.equal(main.split('MmScreenshotPlugin()').length - 1, 1, 'registered once, inside the check');
});

test('the check refuses the real app, and the plugin checks again before it acts', () => {
  assert.match(plugin, /static let prodBundleId = "com\.martianmacros"\n/);
  assert.match(plugin, /return id != prodBundleId && id\.hasPrefix\(prodBundleId \+ "\."\)/);
  assert.match(plugin, /override public func load\(\) \{\s*guard MmScreenshotPlugin\.isAllowed else \{ return \}/);
  assert.match(plugin, /private func serveRequest\(\) \{\s*guard MmScreenshotPlugin\.isAllowed,/);
  assert.match(plugin, /pluginMethods: \[CAPPluginMethod\] = \[\]/, 'nothing is open to the web app');
});

test('the plugin is in the app target, as the other plugins are', () => {
  const project = shell('App.xcodeproj/project.pbxproj');
  assert.equal(project.split('/* MmScreenshotPlugin.swift in Sources */').length - 1, 2, 'a build file and its line in the Sources phase');
  assert.match(project, /\/\* MmScreenshotPlugin\.swift \*\/ = \{isa = PBXFileReference; [^}]*path = MmScreenshotPlugin\.swift;/);
});

test('the plugin answers the names the runner sends', () => {
  const commands = phoneScreenshotCommands('phone', 'com.martianmacros.dev', 'STAMP');
  const destination = commands.request('/tmp/r')[commands.request('/tmp/r').indexOf('--destination') + 1];
  const source = commands.fetch('/tmp/p')[commands.fetch('/tmp/p').indexOf('--source') + 1];
  assert.equal(destination, 'Library/Caches/mm-screenshot-STAMP.request');
  assert.equal(source, 'Library/Caches/mm-screenshot-STAMP.png');
  assert.match(plugin, /urls\(for: \.cachesDirectory, in: \.userDomainMask\)/, 'Library/Caches');
  assert.match(plugin, /static let prefix = "mm-screenshot-"/);
  assert.match(plugin, /static let requestSuffix = "\.request"/);
  assert.match(plugin, /"\\\(MmScreenshotPlugin\.prefix\)\\\(stamp\)\.png"/);
  assert.equal(commands.nudge.at(-1), 'com.martianmacros.dev.mm-screenshot');
  assert.match(plugin, /\(Bundle\.main\.bundleIdentifier \?\? prodBundleId\) \+ "\.mm-screenshot"/);
});
