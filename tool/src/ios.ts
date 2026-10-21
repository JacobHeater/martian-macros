import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { stderr, stdout } from 'node:process';
import { webBuildEnv } from './android.ts';
import { appIdOf, displayNameOf, identityOf, iosSuffixOf, type Identity } from './identity.ts';
import { capture, run } from './proc.ts';

const webApp = 'apps/mobile';
const iosProject = `${webApp}/ios/App`;

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

/** One iPhone paired with this Mac, as `xcrun devicectl list devices` lists it (MM-412). */
export interface Phone {
  /** devicectl's own identifier, the one its commands take. */
  readonly id: string;
  readonly name: string;
  /** As "iPhone 16 Pro Max". */
  readonly model: string;
  readonly osVersion: string;
  /** Whether it is reachable now, by cable or over the network; a paired phone that is away is listed too. */
  readonly connected: boolean;
}

/** The iPhones in what `xcrun devicectl list devices --json-output` wrote, connected ones first. */
export function phonesOf(listJson: string): Phone[] {
  const parsed = JSON.parse(listJson) as {
    result?: {
      devices?: {
        identifier: string;
        deviceProperties?: { name?: string; osVersionNumber?: string };
        hardwareProperties?: { marketingName?: string; deviceType?: string; platform?: string };
        connectionProperties?: { transportType?: string; pairingState?: string };
      }[];
    };
  };
  return (parsed.result?.devices ?? [])
    .filter((device) => device.hardwareProperties?.deviceType === 'iPhone' || device.hardwareProperties?.platform === 'iOS')
    .map((device) => ({
      id: device.identifier,
      name: device.deviceProperties?.name ?? device.identifier,
      model: device.hardwareProperties?.marketingName ?? 'iPhone',
      osVersion: device.deviceProperties?.osVersionNumber ?? '',
      connected: device.connectionProperties?.transportType !== undefined,
    }))
    .sort((a, b) => Number(b.connected) - Number(a.connected));
}

/**
 * The phone to use: `wanted` by id or name (else `MM_IPHONE`), otherwise the
 * one connected. A message says why none could be chosen, and what to do.
 */
export function choosePhone(phones: readonly Phone[], wanted: string | undefined): Phone | string {
  if (wanted !== undefined) {
    const named = phones.find((phone) => phone.id === wanted || phone.name === wanted);
    if (named === undefined) return `iPhone "${wanted}" not found. Paired: ${phones.map((p) => `${p.name} (${p.id})`).join(', ') || '(none)'}`;
    return named.connected ? named : `${named.name} is paired but not connected. Plug it in, unlock it, and run again.`;
  }
  const connected = phones.filter((phone) => phone.connected);
  if (connected.length === 1) return connected[0]!;
  if (connected.length > 1) return `Several iPhones are connected: ${connected.map((p) => `${p.name} (${p.id})`).join(', ')}. Say which: mm run --ios --phone <name | id>.`;
  if (phones.length > 0) return `${phones.map((p) => p.name).join(', ')} ${phones.length === 1 ? 'is' : 'are'} paired but not connected. Plug the phone in, unlock it, and run again.`;
  return 'No iPhone is paired with this Mac. Plug it in, trust this computer on the phone, and see docs/ios-signing.md.';
}

/**
 * The `xcodebuild` arguments. A simulator build needs no signing team. A
 * phone build (MM-412) is signed: the team comes from `MM_APPLE_TEAM` when
 * set, else from the project's own (uncommitted) `DEVELOPMENT_TEAM` line,
 * and Xcode may fetch or make the profile (`-allowProvisioningUpdates`).
 * The identity is two build settings the project reads (MM-8): the suffix
 * on `com.martianmacros`, and the name on the Home Screen.
 */
export function xcodebuildArgs({
  release,
  identity = 'dev',
  phone = false,
  team,
}: {
  release: boolean;
  identity?: Identity;
  phone?: boolean;
  team?: string | undefined;
}): string[] {
  return [
    'xcodebuild',
    '-project',
    'App.xcodeproj',
    '-scheme',
    'App',
    '-configuration',
    release ? 'Release' : 'Debug',
    '-sdk',
    phone ? 'iphoneos' : 'iphonesimulator',
    '-destination',
    phone ? 'generic/platform=iOS' : 'generic/platform=iOS Simulator',
    '-derivedDataPath',
    'build',
    ...(phone ? ['-allowProvisioningUpdates', ...(team === undefined || team === '' ? [] : [`DEVELOPMENT_TEAM=${team}`])] : ['CODE_SIGNING_ALLOWED=NO']),
    `MM_IDENTITY_SUFFIX=${iosSuffixOf(identity)}`,
    `MM_DISPLAY_NAME=${displayNameOf(identity)}`,
    'build',
  ];
}

/** Where a build puts the app: the simulator's, or the phone's. */
const builtApp = (repoRoot: string, release: boolean, phone = false) =>
  `${repoRoot}/${iosProject}/build/Build/Products/${release ? 'Release' : 'Debug'}-${phone ? 'iphoneos' : 'iphonesimulator'}/App.app`;

/** The iPhones paired with this Mac, as devicectl lists them; throws when devicectl cannot be run. */
export async function pairedPhones(): Promise<Phone[]> {
  const out = join(tmpdir(), `mm-devices-${process.pid}.json`);
  const listed = await capture(['xcrun', 'devicectl', 'list', 'devices', '--json-output', out]);
  if (listed.code !== 0) throw new Error('xcrun devicectl could not be run. It comes with Xcode 15 or newer; select it with xcode-select.');
  try {
    return phonesOf(readFileSync(out, 'utf8'));
  } finally {
    rmSync(out, { force: true });
  }
}

/** The identity a run asked for: the dev twin unless said (`--prod`, `--env`), except a phone, which is the real app unless said (MM-412). */
const identityFor = (args: readonly string[]): ReturnType<typeof identityOf> =>
  args.includes('--phone') && !args.includes('--env') && !args.includes('--prod') ? 'prod' : identityOf(args);

async function installedSimulators(): Promise<Simulator[]> {
  const listed = await capture(['xcrun', 'simctl', 'list', '-j', 'devices', 'available']);
  if (listed.code !== 0) throw new Error('xcrun simctl could not be run. Install Xcode and select it with xcode-select.');
  return simulatorsOf(listed.stdout);
}

/**
 * `mm build ios [--release] [--phone]`: the web app, the sync into the iOS
 * shell and a simulator build (MM-403), or a signed phone build (MM-412;
 * the team as `xcodebuildArgs` says, docs/ios-signing.md).
 */
export async function runIosBuild(repoRoot: string, args: readonly string[], { seed = false }: { seed?: boolean } = {}): Promise<number> {
  if (process.platform !== 'darwin') {
    stderr.write('An iOS build needs a Mac with Xcode.\n');
    return 69;
  }
  // `--env prod|dev|demo` chooses the identity (MM-8); the dev twin unless said, the real app on a phone.
  const identity = identityFor(args);
  if (identity !== 'prod' && identity !== 'dev' && identity !== 'demo') {
    stderr.write(`${identity}\n`);
    return 64;
  }
  const synced = await run(['npm', 'run', 'ios'], { cwd: `${repoRoot}/${webApp}`, env: webBuildEnv(process.env, { seed, identity }) });
  if (synced !== 0) return synced;
  const phone = args.includes('--phone');
  return run(xcodebuildArgs({ release: args.includes('--release'), identity, phone, team: process.env['MM_APPLE_TEAM'] }), {
    cwd: `${repoRoot}/${iosProject}`,
  });
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

/**
 * `mm run --ios --phone [name | id]`: builds signed, installs and launches on
 * the iPhone plugged into this Mac (MM-412). The real app unless `--env`
 * says; `MM_IPHONE` names the default phone. The first time, iOS refuses to
 * open the app until the developer is trusted (docs/ios-signing.md).
 */
async function runOnPhone(repoRoot: string, args: readonly string[]): Promise<number> {
  const after = args[args.indexOf('--phone') + 1];
  const wanted = after !== undefined && !after.startsWith('-') ? after : process.env['MM_IPHONE'];
  let phone: Phone;
  try {
    const chosen = choosePhone(await pairedPhones(), wanted);
    if (typeof chosen === 'string') {
      stderr.write(`${chosen}\n`);
      return 69;
    }
    phone = chosen;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : error}\n`);
    return 69;
  }
  const identity = identityFor(args);
  if (identity !== 'prod' && identity !== 'dev' && identity !== 'demo') {
    stderr.write(`${identity}\n`);
    return 64;
  }
  stdout.write(`${phone.name} (${phone.model}, iOS ${phone.osVersion}): building ${displayNameOf(identity)}\n`);
  const built = await runIosBuild(repoRoot, args.filter((arg) => arg !== '--seed'), { seed: args.includes('--seed') });
  if (built !== 0) return built;
  const release = args.includes('--release');
  const installed = await run(['xcrun', 'devicectl', 'device', 'install', 'app', '--device', phone.id, builtApp(repoRoot, release, true)]);
  if (installed !== 0) return installed;
  const launched = await run(['xcrun', 'devicectl', 'device', 'process', 'launch', '--terminate-existing', '--device', phone.id, appIdOf(identity)]);
  if (launched !== 0) {
    stderr.write('Installed, but not opened. The first time, trust the developer on the phone: Settings, General, VPN & Device Management, then open the app.\n');
  }
  return launched;
}

/** `mm run --ios [-d UDID]`: builds, installs and launches on a simulator (MM-403); with `--phone`, on the iPhone (MM-412). */
export async function runIosApp(repoRoot: string, args: readonly string[]): Promise<number> {
  if (args.includes('--phone')) return runOnPhone(repoRoot, args);
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
  const identity = identityOf(args);
  if (identity !== 'prod' && identity !== 'dev' && identity !== 'demo') {
    stderr.write(`${identity}\n`);
    return 64;
  }
  // `--seed` is the demo's alone (MM-177); the build refuses it for any other identity.
  const built = await runIosBuild(repoRoot, args.filter((arg) => arg !== '--seed'), { seed: args.includes('--seed') });
  if (built !== 0) return built;
  const ready = await ensureBooted(simulator);
  if (ready !== 0) return ready;
  const installed = await run(['xcrun', 'simctl', 'install', simulator.udid, builtApp(repoRoot, false)]);
  if (installed !== 0) return installed;
  return run(['xcrun', 'simctl', 'launch', simulator.udid, appIdOf(identity)]);
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
