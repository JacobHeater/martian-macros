import 'package:mm_domain/mm_domain.dart';

import 'report_period.dart';

/// The monthly reports available on [today], oldest first (MM-33): every
/// 28-day span since [onboardedOn] that has finished. A span in progress has
/// no report yet.
List<ReportPeriod> reportPeriods({
  required CalendarDate onboardedOn,
  required CalendarDate today,
}) {
  final periods = <ReportPeriod>[];
  for (var index = 0; ; index++) {
    final period = ReportPeriod(
      index: index,
      from: onboardedOn.addDays(index * ReportPeriod.days),
    );
    if (period.readyOn.isAfter(today)) break;
    periods.add(period);
  }
  return periods;
}
