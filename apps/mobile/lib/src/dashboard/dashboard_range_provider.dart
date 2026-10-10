import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'dashboard_range.dart';

final dashboardRangeProvider = NotifierProvider<DashboardRange, int>(
  DashboardRange.new,
);
