import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'recovery_check_in_screen_state.dart';

/// The weekly recovery check-in (MM-116): five questions on a five-point
/// scale and, optionally, typical hours of sleep. Twenty seconds.
class RecoveryCheckInScreen extends ConsumerStatefulWidget {
  const RecoveryCheckInScreen({super.key});

  @override
  ConsumerState<RecoveryCheckInScreen> createState() =>
      RecoveryCheckInScreenState();
}
