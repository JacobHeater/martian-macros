import '../calendar_date.dart';
import 'entitlement_status.dart';

/// The user's current entitlement.
final class Entitlement {
  const Entitlement(this.status, {this.trialEndsOn});

  final EntitlementStatus status;

  /// The last day of the trial, while [status] is trial.
  final CalendarDate? trialEndsOn;

  bool get coachAvailable => status != EntitlementStatus.free;
}
