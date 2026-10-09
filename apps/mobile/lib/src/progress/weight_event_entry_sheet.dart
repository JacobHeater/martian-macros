import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'weight_event_entry_sheet_state.dart';

class WeightEventEntrySheet extends ConsumerStatefulWidget {
  const WeightEventEntrySheet({required this.today, super.key});

  final CalendarDate today;

  @override
  ConsumerState<WeightEventEntrySheet> createState() =>
      WeightEventEntrySheetState();
}
