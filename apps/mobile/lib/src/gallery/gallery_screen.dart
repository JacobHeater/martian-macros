import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'gallery_screen_state.dart';

/// Every token and component in every state, in light or dark and at any
/// text size. Reachable from Settings in development builds only.
class GalleryScreen extends ConsumerStatefulWidget {
  const GalleryScreen({super.key});

  @override
  ConsumerState<GalleryScreen> createState() => GalleryScreenState();
}
