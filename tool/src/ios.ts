import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { webBuildEnv } from './android.ts';
import { capture, run } from './proc.ts';

const webApp = 'apps/mobile';
const iosProject = `${webApp}/ios/App`;
const appId = 'com.martianmacros.martian_macros.demo';

/** Whether `id` names a simulator (its UDID), as against an Android device. */
export function isSimulatorId(id: string): boolean {
  return /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(id);
}

/** One iPhone simulator, as `simctl` lists it. */
export interface Simulator {
  readonly udid: string;
  readonly name: string;
  /** `Booted` or `Shutdown`. */
  readonly state: string;
  /** The iOS version, as "26.3". */
  readonly runtime: string;
}

/**
 * The iPhone simulators in what `xcrun simctl list -j devices available`
 * printed, the newest iOS first and, within one, in the order listed.
 */
export function simulatorsOf(listJson: string): Simulator[] {
  const parsed = JSON.parse(listJson) as { devices?: Record<string, { udid: string; name: string; state: string; isAvailable?: boolean }[]> };
  const found: Simulator[] = [];
  for (const [runtimeId, devices] of Object.entries(parsed.devices ?? {})) {
    const version = /iOS-(\d+)-(\d+)/.exec(runtimeId);
    if (version === null) continue;
    for (const device of devices) {
      if (device.isAvailable === false || !device.name.startsWith('iPhone')) continue;
      found.push({ udid: device.udid, name: device.name, state: device.state, runtime: `${version[1]}.${version[2]}` });
    }
  }
  const numbered = (runtime: string) => runtime.split('.').map(Number) as [number, number];
  return found.sort((a, b) => {
    const [aMajor, aMinor] = numbered(a.runtime);
    const [bMajor, bMinor] = numbered(b.runtime);
    return bMajor - aMajor || bMinor - aMinor;
  });
}

/**
 * The simulator to use: `wanted` by UDID or name (else `MM_SIMULATOR`),
 * otherwise the booted one, otherwise the first installed. A message says
 * why none could be chosen.
 */
export function chooseSimulator(simulators: readonly Simulator[], wanted: string | undefined): Simulator | string {
  if (wanted !== undefined) {
    const named = simulators.find((simulator) => simulator.udid === wanted || simulator.name === wanted);
    return named ?? `Simulator "${wanted}" not found. Installed: ${simulators.map((s) => `${s.name} (${s.udid})`).join(', ') || '(none)'}`;
  }
  if (simulators.length === 0) {
    return 'No iPhone simulator is installed. In Xcode, Settings, Components, download an iOS runtime, then mm simulator list.';
  }
  return simulators.find((simulator) => simulator.state === 'Booted') ?? simulators[0]!;
}

/** The `xcodebuild` arguments for a simulator build, which needs no signing team. */
export function xcodebuildArgs({ release }: { release: boolean }): string[] {
  return [
    'xcodebuild',
    '-project',
    'App.xcodeproj',
    '-scheme',
    'App',
    '-configuration',
    release ? 'Release' : 'Debug',
    '-sdk',
    'iphonesimulator',
    '-destination',
    'generic/platform=iOS Simulator',
    '-derivedDataPath',
    'build',
    'CODE_SIGNING_ALLOWED=NO',
    'build',
  ];
}

/** Where a simulator build puts the app. */
const builtApp = (repoRoot: string, release: boolean) =>
  `${repoRoot}/${iosProject}/build/Build/Products/${release ? 'Release' : 'Debug'}-iphonesimulator/App.app`;

async function installedSimulators(): Promise<Simulator[]> {
  const listed = await capture(['xcrun', 'simctl', 'list', '-j', 'devices', 'available']);
  if (listed.code !== 0) throw new Error('xcrun simctl could not be run. Install Xcode and select it with xcode-select.');
  return simulatorsOf(listed.stdout);
}

/**
 * `mm build ios [--release]`: the web app, the sync into the iOS shell and
 * a simulator build (MM-403). A device build is made in Xcode, with a
 * signing team (docs/ios-signing.md).
 */
export async function runIosBuild(repoRoot: string, args: readonly string[], { seed = false }: { seed?: boolean } = {}): Promise<number> {
  if (process.platform !== 'darwin') {
    stderr.write('An iOS build needs a Mac with Xcode.\n');
    return 69;
  }
  const synced = await run(['npm', 'run', 'ios'], { cwd: `${repoRoot}/${webApp}`, env: webBuildEnv(process.env, { seed }) });
  if (synced !== 0) return synced;
  return run(xcodebuildArgs({ release: args.includes('--release') }), { cwd: `${repoRoot}/${iosProject}` });
}

/** Boots `simulator` if it is not running, shows its window, and waits until it answers. */
async function ensureBooted(simulator: Simulator): Promise<number> {
  const booted = await run(['xcrun', 'simctl', 'bootstatus', simulator.udid, '-b']);
  if (booted !== 0) return booted;
  // The window, so what runs can be seen; bootstatus alone boots without one.
  await capture(['open', '-a', 'Simulator']);
  return 0;
}

/** `mm simulator [name | udid] | list`: starts a simulator and waits for it (MM-403). */
export async function runSimulator(args: readonly string[]): Promise<number> {
  try {
    const simulators = await installedSimulators();
    if (args[0] === 'list') {
      stdout.write(
        simulators.length === 0
          ? 'No iPhone simulators installed.\n'
          : `${simulators.map((s) => `${s.udid}  ${s.name} (iOS ${s.runtime}, ${s.state})`).join('\n')}\n`,
      );
      return 0;
    }
    const chosen = chooseSimulator(simulators, args.find((arg) => !arg.startsWith('-')) ?? process.env['MM_SIMULATOR']);
    if (typeof chosen === 'string') {
      stderr.write(`${chosen}\n`);
      return 69;
    }
    const code = await ensureBooted(chosen);
    if (code === 0) stdout.write(`${chosen.name} (${chosen.udid}) ready.\n`);
    return code;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : error}\n`);
    return 69;
  }
}

/** `mm run --ios [-d UDID]`: builds, installs and launches on a simulator (MM-403). */
export async function runIosApp(repoRoot: string, args: readonly string[]): Promise<number> {
  const wanted = args.includes('-d') ? args[args.indexOf('-d') + 1] : process.env['MM_SIMULATOR'];
  let simulator: Simulator;
  try {
    const chosen = chooseSimulator(await installedSimulators(), wanted);
    if (typeof chosen === 'string') {
      stderr.write(`${chosen}\n`);
      return 69;
    }
    simulator = chosen;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : error}\n`);
    return 69;
  }
  const built = await runIosBuild(repoRoot, []);
  if (built !== 0) return built;
  const ready = await ensureBooted(simulator);
  if (ready !== 0) return ready;
  const installed = await run(['xcrun', 'simctl', 'install', simulator.udid, builtApp(repoRoot, false)]);
  if (installed !== 0) return installed;
  return run(['xcrun', 'simctl', 'launch', simulator.udid, appId]);
}

/**
 * `mm screenshot -d UDID [path] [--clipboard]` for a simulator: its screen
 * as a PNG, through `simctl` (MM-403). The clipboard is the caller's.
 */
export async function simulatorScreenshot(udid: string, path: string): Promise<number> {
  const taken = await capture(['xcrun', 'simctl', 'io', udid, 'screenshot', path]);
  if (taken.code !== 0) {
    stderr.write(`${taken.stderr.trim() || taken.stdout.trim() || 'simctl failed'}\n`);
    return 1;
  }
  return 0;
}

/** A place for a screenshot nobody asked to keep. */
export const temporaryScreenshot = (stamp: string): string => join(tmpdir(), `mm-screenshot-${stamp}.png`);

/** Removes the iOS build. */
export function cleanIos(repoRoot: string): void {
  const dir = resolve(`${repoRoot}/${iosProject}/build`);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    stdout.write(`removed ${iosProject}/build\n`);
  }
}
