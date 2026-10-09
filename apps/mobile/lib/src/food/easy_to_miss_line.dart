import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'easy_to_miss_line_state.dart';

/// One line under a day marked complete that names the things people most
/// often forget to log (MM-152). A prompt, never a gate: the day is already
/// stored as complete. It fades after the first two weeks, and is never shown
/// to someone who turned it off or with an eating-disorder history.
class EasyToMissLine extends ConsumerStatefulWidget {
  const EasyToMissLine({required this.day, super.key});

  /// The day being viewed, which new entries are logged to.
  final CalendarDate day;

  @override
  ConsumerState<EasyToMissLine> createState() => EasyToMissLineState();
}
