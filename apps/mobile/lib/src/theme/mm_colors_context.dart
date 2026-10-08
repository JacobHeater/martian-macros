import 'package:flutter/material.dart';

import 'mm_colors.dart';

extension MmColorsContext on BuildContext {
  /// The app's colors by meaning, for the current theme.
  MmColors get mm => Theme.of(this).extension<MmColors>()!;
}
