import 'logs.dart';
import 'synthetic_user.dart';

/// Runs [user] at a fixed logged intake for [days].
Logs simulate(
  SyntheticUser user, {
  required int days,
  required double loggedKcal,
  void Function(int day, SyntheticUser user)? beforeDay,
}) {
  final logs = Logs();
  for (var d = 0; d < days; d++) {
    beforeDay?.call(d, user);
    logs.trueTdee.add(user.trueTdeeKcal);
    final day = user.liveDay(loggedKcal);
    if (day.intake != null) logs.intake.add(day.intake!);
    if (day.weight != null) logs.weights.add(day.weight!);
  }
  return logs;
}
