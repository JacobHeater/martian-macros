import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../progress/strength_trends_provider.dart';

/// Personal records by the id of the workout that set them (MM-92). Empty
/// while the strength history loads.
final personalRecordsProvider = Provider<Map<int, List<PersonalRecord>>>(
  (ref) =>
      personalRecordsOf(ref.watch(strengthTrendsProvider).value ?? const []),
);
