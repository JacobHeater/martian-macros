import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_engine/mm_engine.dart';

import '../integration_providers.dart';
import 'rest_alarm.dart';
import 'rest_signal_provider.dart';

class RestAlarmState extends ConsumerState<RestAlarm> {
  Timer? _timer;

  /// When the rest now waited for reaches its target.
  DateTime? _due;

  @override
  void initState() {
    super.initState();
    _schedule();
  }

  @override
  void didUpdateWidget(RestAlarm oldWidget) {
    super.didUpdateWidget(oldWidget);
    _schedule();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _schedule() {
    final workout = widget.workout;
    final started = restStartedAt(workout);
    final target = restTargetOf(workout);
    final resting =
        workout.inProgress && !workout.paused && workout.setStartedAt == null;
    final due = !resting || started == null || target == null
        ? null
        : started.add(target);
    if (due == _due) return;
    _due = due;
    _timer?.cancel();
    _timer = null;
    if (due == null) return;
    final left = due.difference(ref.read(clockProvider).now());
    // Already over: it is shown, not signalled late.
    if (left <= Duration.zero) return;
    final signal = ref.read(restSignalProvider);
    _timer = Timer(left, signal.restOver);
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
