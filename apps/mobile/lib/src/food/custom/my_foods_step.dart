import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'my_foods_step_state.dart';

/// The foods and recipes the user saved: add, edit and delete them (MM-45).
class MyFoodsStep extends ConsumerStatefulWidget {
  const MyFoodsStep({required this.onBack, this.initialBarcode, super.key});

  final VoidCallback onBack;

  /// Opens the new-food form for this product, so its label can be read and
  /// the next scan finds it (MM-44).
  final String? initialBarcode;

  @override
  ConsumerState<MyFoodsStep> createState() => MyFoodsStepState();
}
