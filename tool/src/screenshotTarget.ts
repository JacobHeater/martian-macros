import { isSimulatorId, type Phone } from './ios.ts';

/**
 * Where `mm screenshot` goes: `--phone` is the Android phone plugged in, as
 * `mm run --phone` means (MM-732), unless `--ios` says the iPhone; `-d`
 * naming a paired iPhone by devicectl's name or id is the iPhone (MM-536);
 * otherwise a UDID is a simulator (MM-403) and anything else adb (MM-238).
 * The iPhone is checked before the simulator, since a phone's devicectl id
 * and a simulator's UDID look alike.
 */
export function screenshotTarget(device: string | undefined, phone: boolean, ios: boolean, phones: readonly Phone[]): 'phone' | 'simulator' | 'android' {
  if (phone) return ios ? 'phone' : 'android';
  if (device === undefined) return 'android';
  if (phones.some((paired) => paired.id === device || paired.name === device)) return 'phone';
  return isSimulatorId(device) ? 'simulator' : 'android';
}
