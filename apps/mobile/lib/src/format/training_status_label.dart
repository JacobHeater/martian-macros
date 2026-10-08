import 'package:mm_domain/mm_domain.dart';

extension TrainingStatusLabel on TrainingStatus {
  String get label => switch (this) {
    TrainingStatus.untrained => 'Not lifting yet',
    TrainingStatus.novice => 'Under 1 year',
    TrainingStatus.returning => 'Returning after 6+ months off',
    TrainingStatus.intermediate => '1–3 years',
    TrainingStatus.advanced => '3+ years',
  };
}
