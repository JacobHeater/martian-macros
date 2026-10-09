import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'target_change_summary_host_state.dart';

class TargetChangeSummaryHost extends ConsumerStatefulWidget {
  const TargetChangeSummaryHost({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<TargetChangeSummaryHost> createState() =>
      TargetChangeSummaryHostState();
}
