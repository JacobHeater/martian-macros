import { identityOf, type Identity } from './identity.ts';

/** What `mm screenshot` was asked for. */
interface ScreenshotArgs {
  /** `-d`'s value: an Android serial, a simulator's UDID, or a paired iPhone's name or devicectl id. */
  readonly device: string | undefined;
  /** `--phone`: the iPhone plugged in (MM-536). It takes no value, so a path may follow it. */
  readonly phone: boolean;
  /** For a phone, the app to ask: the dev twin unless `--env demo` says; `--prod` is refused later. A usage error as text. */
  readonly identity: Identity | string;
  /** Where to write the PNG, when given. */
  readonly out: string | undefined;
  readonly clipboard: boolean;
}

/** The flags that take a value, which is then not a path. */
const valued = new Set(['-d', '--env']);

/** Reads `mm screenshot [-d DEVICE | --phone] [--env dev|demo] [path] [--clipboard]` (MM-238, MM-403, MM-536). */
export function screenshotArgs(args: readonly string[]): ScreenshotArgs {
  const at = args.indexOf('-d');
  return {
    device: at === -1 ? undefined : args[at + 1],
    phone: args.includes('--phone'),
    identity: identityOf(args),
    out: args.find((arg, index) => !arg.startsWith('-') && !valued.has(args[index - 1] ?? '')),
    clipboard: args.includes('--clipboard'),
  };
}
