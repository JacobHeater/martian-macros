import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'theme_chooser_screen_state.dart';

/// New-install appearance choice before collecting profile information.
class ThemeChooserScreen extends ConsumerStatefulWidget {
  const ThemeChooserScreen({super.key});

  @override
  ConsumerState<ThemeChooserScreen> createState() => ThemeChooserScreenState();
}
