import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'haptic_rest_signal.dart';

/// How the end of a rest is signalled (MM-191). A test overrides it.
final restSignalProvider = Provider<RestSignal>(
  (ref) => const HapticRestSignal(),
);
