import type { ReminderSetting } from '../domain/ReminderSetting';
import { reminderCountFrom } from '../engine/reminderCountFrom';
import { ReminderRule } from '../engine/ReminderRule';
import { clockTimeText } from '../format/clockTimeText';
import { reminderLabel } from '../format/reminderLabel';
import { reminderSentWhen } from '../format/reminderSentWhen';
import { minuteOfDayNow } from '../state/minuteOfDayNow';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { GroupHeader } from '../ui/GroupHeader';
import { MmIcon } from '../ui/MmIcon';
import { MmListGroup } from '../ui/MmListGroup';
import { MmListRow } from '../ui/MmListRow';
import { MmSwitchRow } from '../ui/MmSwitchRow';
import { useOverlays } from '../ui/useOverlays';

const time = (minuteOfDay: number) => clockTimeText(new Date(2000, 0, 1, Math.trunc(minuteOfDay / 60), minuteOfDay % 60));

/**
 * The Reminders group of Settings (MM-146). Every reminder is off until
 * the user turns it on, and the phone's permission is asked for only then.
 */
export function RemindersSection() {
  const { services, state } = useApp();
  const overlays = useOverlays();
  const settings = useCell(state.reminderSettings);
  const today = useCell(state.today);

  const toggle = async (setting: ReminderSetting, on: boolean) => {
    if (!on) {
      await services.reminders.saveReminder(setting.copyWith({ enabled: false }));
      return;
    }
    if (!(await services.reminderScheduler.requestPermission())) {
      overlays.snack('Notifications are off for this app in your phone’s settings.');
      return;
    }
    await services.reminders.saveReminder(
      setting.copyWith({
        enabled: true,
        countFrom: reminderCountFrom({
          today,
          minuteNow: minuteOfDayNow(services.clock),
          minuteOfDay: setting.minuteOfDay,
        }),
      }),
    );
  };

  const changeTime = async (setting: ReminderSetting) => {
    const picked = await overlays.timeOfDay({
      initialMinuteOfDay: setting.minuteOfDay,
      helpText: `${reminderLabel(setting.kind)} reminder`,
    });
    if (picked === undefined) return;
    if (ReminderRule.isQuiet(picked)) {
      overlays.snack('Reminders are not sent between 9 pm and 7 am.');
      return;
    }
    await services.reminders.saveReminder(setting.copyWith({ minuteOfDay: picked }));
  };

  return (
    <>
      <GroupHeader text="Reminders" />
      <MmListGroup>
        {settings.map((setting) => (
          <div key={setting.kind}>
            <MmSwitchRow
              title={reminderLabel(setting.kind)}
              subtitle={reminderSentWhen(setting.kind)}
              value={setting.enabled}
              onChange={(on) => void toggle(setting, on)}
            />
            {setting.enabled ? (
              <MmListRow
                dense
                leadingIcon="timer"
                title={`At ${time(setting.minuteOfDay)}`}
                trailing={<MmIcon name="chevronRight" />}
                onPress={() => void changeTime(setting)}
              />
            ) : null}
          </div>
        ))}
      </MmListGroup>
      <p className="app-caption settings-note">
        At most two a day, never at night, and never during a pause. A reminder that goes unanswered for a week stops
        by itself. Nothing about your weight or food ever appears in one.
      </p>
    </>
  );
}
