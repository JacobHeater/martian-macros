import 'package:mm_domain/mm_domain.dart';

import 'settling_window.dart';
import 'tdee_status.dart';

final class TdeeEstimate {
  const TdeeEstimate({
    required this.kcal,
    required this.sigmaKcal,
    required this.status,
    this.usableIntakeDays = 0,
    this.excludedPartialDays = 0,
    this.weighIns = 0,
    this.windowStart,
    this.clampedToBounds = false,
    this.settlingUntil,
    this.styleRestartOn,
  });

  /// Maintenance intake, in the user's own logging units.
  ///
  /// Consistent logging bias (always under-logging oil, say) is absorbed
  /// here, so targets expressed in the same units still produce the
  /// intended outcome. Weight change is valued in true kcal, so this is
  /// exact once intake is steady at target; the weekly loop converges to
  /// that fixed point.
  final double kcal;
  final double sigmaKcal;
  final TdeeStatus status;
  final int usableIntakeDays;
  final int excludedPartialDays;
  final int weighIns;

  /// First day of the window actually used (later than the nominal window
  /// start when a logging-style switch truncated it).
  final CalendarDate? windowStart;

  /// True if the raw estimate fell outside the plausible range and was
  /// clamped; a strong hint that logging is unreliable.
  final bool clampedToBounds;

  /// Set when the estimate is held because too few days remain once a
  /// [SettlingWindow] is left out: the last day of that window.
  final CalendarDate? settlingUntil;

  /// First day of a new logging-style regime inside the estimator window.
  final CalendarDate? styleRestartOn;
}
