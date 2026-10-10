import 'package:mm_domain/mm_domain.dart';

extension PauseReasonLabel on PauseReason {
  String get label => switch (this) {
    PauseReason.travel => 'Travel',
    PauseReason.illness => 'Illness',
    PauseReason.injury => 'Injury',
    PauseReason.other => 'Other',
  };
}
