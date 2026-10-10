import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'ticking_state.dart';

/// Rebuilds once a second with the app's time, for a running timer (MM-191).
/// The time comes from the app's clock, so a test can fix it.
class Ticking extends ConsumerStatefulWidget {
  const Ticking({required this.builder, super.key});

  final Widget Function(BuildContext context, DateTime now) builder;

  @override
  ConsumerState<Ticking> createState() => TickingState();
}
