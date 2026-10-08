import 'package:flutter/material.dart';

import 'mm_colors.dart';

/// The type roles of `design/visual-language.md`, mapped onto Material's text
/// slots so every stock widget picks them up.
///
/// | role     | slot(s)                                  |
/// |----------|------------------------------------------|
/// | figureXL | displayLarge                             |
/// | figure   | displayMedium, displaySmall              |
/// | title    | headlineLarge/Medium/Small, titleLarge   |
/// | heading  | titleMedium                              |
/// | body     | bodyLarge, bodyMedium                    |
/// | label    | titleSmall, labelLarge, labelMedium      |
/// | caption  | bodySmall, labelSmall                    |
abstract final class MmType {
  static const _grotesk = 'SpaceGrotesk';
  static const _inter = 'Inter';
  static const _tabular = [FontFeature.tabularFigures()];

  static TextStyle _style({
    required String family,
    required double size,
    required double line,
    required double weight,
    required Color color,
    double tracking = 0,
    bool tabular = false,
  }) => TextStyle(
    fontFamily: family,
    fontSize: size,
    height: line / size,
    fontWeight: FontWeight.values[((weight / 100).round() - 1).clamp(0, 8)],
    fontVariations: [FontVariation('wght', weight)],
    letterSpacing: tracking,
    color: color,
    fontFeatures: tabular ? _tabular : null,
  );

  static TextTheme textTheme(MmColors c) {
    TextStyle grotesk(double size, double line) => _style(
      family: _grotesk,
      size: size,
      line: line,
      weight: 600,
      color: c.text,
      tabular: true,
    );
    final figureXL = grotesk(48, 52);
    final figure = grotesk(32, 36);
    final title = grotesk(22, 28);
    final heading = _style(
      family: _inter,
      size: 17,
      line: 24,
      weight: 600,
      color: c.text,
      tabular: true,
    );
    final body = _style(
      family: _inter,
      size: 15,
      line: 22,
      weight: 400,
      color: c.text,
      tabular: true,
    );
    final label = _style(
      family: _inter,
      size: 13,
      line: 16,
      weight: 600,
      color: c.text,
      tracking: 0.2,
    );
    final caption = _style(
      family: _inter,
      size: 12,
      line: 16,
      weight: 400,
      color: c.text2,
      tabular: true,
    );
    return TextTheme(
      displayLarge: figureXL,
      displayMedium: figure,
      displaySmall: figure,
      headlineLarge: title,
      headlineMedium: title,
      headlineSmall: title,
      titleLarge: title,
      titleMedium: heading,
      titleSmall: label,
      bodyLarge: body,
      bodyMedium: body,
      bodySmall: caption,
      labelLarge: label,
      labelMedium: label,
      labelSmall: caption,
    );
  }
}
