import 'package:mm_domain/mm_domain.dart';

extension DailyActivityLabel on DailyActivity {
  String get label => switch (this) {
    DailyActivity.seated => 'Mostly seated',
    DailyActivity.light => 'Light movement',
    DailyActivity.onFeet => 'On my feet most of the day',
    DailyActivity.physicalJob => 'Physical job',
  };

  /// Examples and a typical step count, so a user can place themselves.
  String get detail => switch (this) {
    DailyActivity.seated => 'Desk work, driving. About 3,000 steps a day.',
    DailyActivity.light => 'Some walking and errands. About 6,000 steps a day.',
    DailyActivity.onFeet =>
      'Retail, teaching, care work. About 10,000 steps a day.',
    DailyActivity.physicalJob =>
      'Trades, farming, delivery on foot. 12,000 steps or more.',
  };
}
