import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'health_recheck_screen_state.dart';

class HealthRecheckScreen extends ConsumerStatefulWidget {
  const HealthRecheckScreen({
    this.pendingGoal,
    this.allowSkip = true,
    super.key,
  });

  final GoalMode? pendingGoal;
  final bool allowSkip;

  @override
  ConsumerState<HealthRecheckScreen> createState() =>
      HealthRecheckScreenState();
}
