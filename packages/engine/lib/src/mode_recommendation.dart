import 'package:mm_domain/mm_domain.dart';

import 'mode_reason.dart';

final class ModeRecommendation {
  const ModeRecommendation(this.mode, this.reason);

  final GoalMode mode;
  final ModeReason reason;
}
