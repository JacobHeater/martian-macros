import type { AppIdentity } from './AppIdentity';

/**
 * The name of the app's database on the phone for `identity` (MM-8). The
 * real app and its dev twin are different apps with different sandboxes,
 * so they share a name; the demo keeps the name the demo always had, so a
 * seed flag can never open an ordinary database by mistake (MM-177).
 */
export function databaseNameFor(identity: AppIdentity): string {
  return identity === 'demo' ? 'martian_macros_demo' : 'martian_macros';
}
