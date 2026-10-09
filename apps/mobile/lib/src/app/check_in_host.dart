import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'check_in.dart';

/// Keeps the check-in running for as long as the app is open. It sits above
/// the navigator: a widget under a covered route is paused, which would hold
/// back new targets while Settings is on screen.
class CheckInHost extends ConsumerWidget {
  const CheckInHost({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(checkInProvider);
    return child;
  }
}
