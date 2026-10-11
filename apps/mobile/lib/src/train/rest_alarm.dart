import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'rest_alarm_state.dart';

/// Signals once when the rest of [workout] reaches its target (MM-191),
/// while this is on screen. A rest already past its target when it appears
/// is not signalled late, and nothing is signalled while the workout is
/// paused or a set is being timed.
class RestAlarm extends ConsumerStatefulWidget {
  const RestAlarm({required this.workout, required this.child, super.key});

  final Workout workout;
  final Widget child;

  @override
  ConsumerState<RestAlarm> createState() => RestAlarmState();
}
