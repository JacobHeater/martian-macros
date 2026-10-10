import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'pause_screen_state.dart';

/// Set, extend or end a pause for a holiday, an illness or an injury
/// (MM-148). A pause is a planned break: while it runs nothing is judged, no
/// check-in happens and the targets become a maintenance guide.
class PauseScreen extends ConsumerStatefulWidget {
  const PauseScreen({super.key});

  @override
  ConsumerState<PauseScreen> createState() => PauseScreenState();
}
