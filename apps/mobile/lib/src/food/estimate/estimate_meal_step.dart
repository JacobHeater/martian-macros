import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'estimate_meal_step_state.dart';

/// Log a meal that cannot be weighed or searched: how big, and what kind
/// (MM-150). It makes an ordinary entry measured by estimate, with the
/// uncertainty that carries.
class EstimateMealStep extends ConsumerStatefulWidget {
  const EstimateMealStep({
    required this.day,
    required this.meal,
    required this.onBack,
    super.key,
  });

  final CalendarDate day;
  final Meal meal;
  final VoidCallback onBack;

  @override
  ConsumerState<EstimateMealStep> createState() => EstimateMealStepState();
}
