import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../repository_role_providers.dart';
import 'pause_controller.dart';

final pauseControllerProvider = Provider<PauseController>(
  (ref) => PauseController(
    pauses: ref.watch(pauseWriterProvider),
    weightEvents: ref.watch(weightEventWriterProvider),
  ),
);
