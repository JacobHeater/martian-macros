/**
 * The three identities the app installs under (MM-8, MM-177): the real one,
 * the development twin that sits beside it, and the seeded demo. One id on
 * both platforms, `com.martianmacros`, with `.dev` and `.demo` for the
 * twins; the shells give them their names.
 */
export type Identity = 'prod' | 'dev' | 'demo';

const identities: readonly Identity[] = ['prod', 'dev', 'demo'];

const names: Record<Identity, string> = { prod: 'Martian Macros', dev: 'Martian Macros Dev', demo: 'Martian Macros DEMO' };
const suffixes: Record<Identity, string> = { prod: '', dev: '.dev', demo: '.demo' };

/**
 * The identity `args` ask for: `--env prod` is the real app, `--env dev`
 * or nothing is the dev twin, and `--env demo` the demo (which `mm demo`
 * asks for by itself). `phone`, which only chooses the device (MM-234),
 * is the dev twin too. Anything else is a usage error, given as text.
 */
export function identityOf(args: readonly string[]): Identity | string {
  const at = args.indexOf('--env');
  if (at === -1) return 'dev';
  const env = args[at + 1];
  if (env === undefined || env.startsWith('-')) return '--env needs a value: prod, dev or phone.';
  if (env === 'phone') return 'dev';
  return (identities as readonly string[]).includes(env) ? (env as Identity) : '--env must be one of: dev, prod, phone';
}

/** The app id on either platform. */
export const appIdOf = (identity: Identity): string => `com.martianmacros${suffixes[identity]}`;

/** What the launcher and the Home Screen call it. */
export const displayNameOf = (identity: Identity): string => names[identity];

/** The suffix the iOS build appends to `com.martianmacros` (`MM_IDENTITY_SUFFIX`). */
export const iosSuffixOf = (identity: Identity): string => suffixes[identity];

/** The Gradle task that assembles the flavor: `assembleDevDebug`, `assembleProdRelease`. */
export const gradleTaskOf = (identity: Identity, { release }: { release: boolean }): string =>
  `assemble${identity[0]!.toUpperCase()}${identity.slice(1)}${release ? 'Release' : 'Debug'}`;

/** Where Gradle puts the flavor's APK, under the Android project. */
export const apkPathOf = (identity: Identity, { release }: { release: boolean }): string =>
  `app/build/outputs/apk/${identity}/${release ? 'release' : 'debug'}/app-${identity}-${release ? 'release-unsigned' : 'debug'}.apk`;
