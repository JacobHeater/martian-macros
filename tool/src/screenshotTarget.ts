import { isSimulatorId, type Phone } from './ios.ts';

/**
 * Where `mm screenshot` goes: `--phone`, or `-d` naming a paired iPhone by
 * devicectl's name or id, is the phone (MM-536); otherwise a UDID is a
 * simulator (MM-403) and anything else adb (MM-238). The phone is checked
 * first, since a phone's devicectl id and a simulator's UDID look alike.
 */
export function screenshotTarget(device: string | undefined, phone: boolean, phones: readonly Phone[]): 'phone' | 'simulator' | 'android' {
  if (phone) return 'phone';
  if (device === undefined) return 'android';
  if (phones.some((paired) => paired.id === device || paired.name === device)) return 'phone';
  return isSimulatorId(device) ? 'simulator' : 'android';
}
