import 'package:mm_domain/mm_domain.dart';

/// The fixed words of each reminder (MM-146). A plain prompt: never a figure,
/// a streak, a count of missed days or a statement about the user.
extension ReminderText on ReminderKind {
  /// The name of the reminder in Settings.
  String get label => switch (this) {
    ReminderKind.weighIn => 'Weigh-in',
    ReminderKind.logFood => 'Log food',
    ReminderKind.weeklyMeasurement => 'Weekly measurement',
  };

  /// When it is sent, for Settings.
  String get sentWhen => switch (this) {
    ReminderKind.weighIn => 'On days with no weigh-in yet.',
    ReminderKind.logFood => 'On days with nothing logged yet.',
    ReminderKind.weeklyMeasurement =>
      'On Sundays, when your waist has not been measured that week.',
  };

  /// The whole text of the notification.
  String get prompt => switch (this) {
    ReminderKind.weighIn => 'Morning weigh-in?',
    ReminderKind.logFood => 'Log today’s food?',
    ReminderKind.weeklyMeasurement => 'Time for this week’s measurement?',
  };

  /// The line shown when it has paused itself.
  String get pausedLine => switch (this) {
    ReminderKind.weighIn => 'Weigh-in reminders are paused.',
    ReminderKind.logFood => 'Food reminders are paused.',
    ReminderKind.weeklyMeasurement => 'Measurement reminders are paused.',
  };
}
