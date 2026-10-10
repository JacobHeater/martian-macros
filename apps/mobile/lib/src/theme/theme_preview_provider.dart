import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'theme_preview.dart';

final themePreviewProvider = NotifierProvider<ThemePreview, ThemePreference?>(
  ThemePreview.new,
);
