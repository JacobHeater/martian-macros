/**
 * The exact-alarm part of the native reminders plugin (MM-248). Each
 * answers the timing as it stands afterwards: "onTheMinute", "notAsked" or
 * "withinAnHour". Whether the person was asked is kept by the plugin.
 */
export interface MmExactAlarmsApi {
  /** How reminders are timed now. Asks nothing. */
  exactAlarms(): Promise<{ timing: string }>;

  /** Opens the phone's own setting, and answers once the person is back. Records that they were asked. */
  openExactAlarmSetting(): Promise<{ timing: string }>;

  /** Records that the person was asked and answered "Not now". */
  skipExactAlarms(): Promise<{ timing: string }>;
}
