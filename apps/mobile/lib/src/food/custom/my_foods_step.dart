import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'my_foods_step_state.dart';

/// The foods and recipes the user saved: add, edit and delete them (MM-45).
class MyFoodsStep extends ConsumerStatefulWidget {
  const MyFoodsStep({required this.onBack, super.key});

  final VoidCallback onBack;

  @override
  ConsumerState<MyFoodsStep> createState() => MyFoodsStepState();
}
