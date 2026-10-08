import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'home_shell_state.dart';

/// The three main destinations and the top bar.
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => HomeShellState();
}
