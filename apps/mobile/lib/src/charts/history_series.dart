import 'package:mm_domain/mm_domain.dart';

import 'history_series_kind.dart';

final class HistorySeries {
  const HistorySeries({
    required this.label,
    required this.values,
    required this.kind,
    this.dashed = false,
    this.connectRecordedPoints = false,
  });

  final String label;
  final Map<CalendarDate, double> values;
  final HistorySeriesKind kind;
  final bool dashed;
  final bool connectRecordedPoints;
}
