import { describe, expect, it } from 'vitest';
import type { MmExactAlarmsApi } from '../../src/platform/MmExactAlarmsApi';
import { NativeExactAlarms } from '../../src/platform/NativeExactAlarms';
import { NoExactAlarmPermission } from '../../src/platform/NoExactAlarmPermission';
import { exactAlarmsContract } from '../contracts/exactAlarmsContract';

/** The plugin stood in for as `MmRemindersPlugin.kt` behaves: asked is kept, the permission is the phone's (MM-248). */
const plugin = ({ held = false, allowInSetting = true }: { held?: boolean; allowInSetting?: boolean } = {}) => {
  let asked = false;
  let allowed = held;
  let opened = 0;
  const timing = () => ({ timing: allowed ? 'onTheMinute' : asked ? 'withinAnHour' : 'notAsked' });
  const api: MmExactAlarmsApi = {
    exactAlarms: async () => timing(),
    openExactAlarmSetting: async () => {
      asked = true;
      opened++;
      allowed = allowed || allowInSetting;
      return timing();
    },
    skipExactAlarms: async () => {
      asked = true;
      return timing();
    },
  };
  return { api, opened: () => opened };
};

exactAlarmsContract('The plugin, allowed (bridge stood in for)', () => new NativeExactAlarms(plugin({ held: true }).api));
exactAlarmsContract('The plugin, not asked (bridge stood in for)', () => new NativeExactAlarms(plugin().api));
exactAlarmsContract(
  'The plugin, declined in the setting (bridge stood in for)',
  () => new NativeExactAlarms(plugin({ allowInSetting: false }).api),
);
exactAlarmsContract('No permission to ask for (a browser)', () => new NoExactAlarmPermission());

describe('NativeExactAlarms', () => {
  it('answers what the plugin answers', async () => {
    const { api, opened } = plugin();
    const alarms = new NativeExactAlarms(api);
    expect(await alarms.timing()).toBe('notAsked');
    expect(await alarms.openSetting()).toBe('onTheMinute');
    expect(opened()).toBe(1);
  });

  it('an answer it does not know promises nothing: within an hour', async () => {
    const alarms = new NativeExactAlarms({
      exactAlarms: async () => ({ timing: 'sometime' }),
      openExactAlarmSetting: async () => ({ timing: '' }),
      skipExactAlarms: async () => ({ timing: 'exact' }),
    });
    expect(await alarms.timing()).toBe('withinAnHour');
    expect(await alarms.openSetting()).toBe('withinAnHour');
    expect(await alarms.notNow()).toBe('withinAnHour');
  });
});
