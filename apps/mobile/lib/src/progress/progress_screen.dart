import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'progress_screen_state.dart';

/// Weigh-in, the weight trend and waist.
class ProgressScreen extends ConsumerStatefulWidget {
  const ProgressScreen({super.key});

  @override
  ConsumerState<ProgressScreen> createState() => ProgressScreenState();
}
