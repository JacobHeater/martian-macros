import { reminderCountFrom } from '../engine/reminderCountFrom';
import { reminderPausedLine } from '../format/reminderPausedLine';
import { minuteOfDayNow } from '../state/minuteOfDayNow';
import { useApp } from '../app/useApp';
import { useCell } from '../app/useCell';
import { MmButton } from '../ui/MmButton';
import { Notice } from '../ui/Notice';

/**
 * One line when a reminder has gone unanswered seven times and paused
 * itself (MM-146): keep it or turn it off. It never escalates or changes
 * tone. Empty when no reminder is paused.
 */
export function ReminderPausedNotice() {
  const { services, state } = useApp();
  const paused = useCell(state.selfPausedReminders);
  const today = useCell(state.today);
  const setting = paused[0];
  if (setting === undefined) return null;
  return (
    <div className="app-stack-item">
      <Notice
        icon="bell"
        text={`${reminderPausedLine(setting.kind)} Keep them or turn them off?`}
        action={
          <div className="app-row">
            <MmButton
              label="Keep"
              kind="secondary"
              onPress={() =>
                void services.reminders.saveReminder(
                  setting.copyWith({
                    countFrom: reminderCountFrom({
                      today,
                      minuteNow: minuteOfDayNow(services.clock),
                      minuteOfDay: setting.minuteOfDay,
                    }),
                  }),
                )
              }
            />
            <MmButton
              label="Turn off"
              kind="text"
              onPress={() => void services.reminders.saveReminder(setting.copyWith({ enabled: false }))}
            />
          </div>
        }
      />
    </div>
  );
}
