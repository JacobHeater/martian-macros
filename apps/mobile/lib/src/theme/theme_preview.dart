import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

class ThemePreview extends Notifier<ThemePreference?> {
  @override
  ThemePreference? build() => null;

  void select(ThemePreference? preference) => state = preference;
}
