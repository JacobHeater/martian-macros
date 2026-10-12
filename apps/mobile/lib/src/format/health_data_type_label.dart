import 'package:mm_health_ingest/mm_health_ingest.dart';

extension HealthDataTypeLabel on HealthDataType {
  /// What the reading is called where the user allows it (MM-68).
  String get label => switch (this) {
    HealthDataType.weight => 'Weight',
    HealthDataType.bodyFat => 'Body fat',
    HealthDataType.leanMass => 'Lean mass',
    HealthDataType.height => 'Height',
    HealthDataType.workout => 'Exercise sessions',
    HealthDataType.menstruation => 'Menstruation',
    HealthDataType.steps => 'Steps',
  };

  /// What the app wants it for, in a sentence, said before it is asked
  /// for.
  String get purpose => switch (this) {
    HealthDataType.weight =>
      'Weigh-ins from your scale, so you need not type them.',
    HealthDataType.bodyFat => 'For the body-fat estimate.',
    HealthDataType.leanMass => 'For the body-fat estimate.',
    HealthDataType.height =>
      'To suggest a correction if it differs from your profile.',
    HealthDataType.workout => 'When you trained, and for how long.',
    HealthDataType.menstruation =>
      'To allow for water weight around your period.',
    HealthDataType.steps =>
      'For context only. Never used to work out your calories.',
  };
}
