import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/theme/mm_colors.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';

double _channel(double c) =>
    c <= 0.03928 ? c / 12.92 : math.pow((c + 0.055) / 1.055, 2.4).toDouble();

double _luminance(Color c) =>
    0.2126 * _channel(c.r) + 0.7152 * _channel(c.g) + 0.0722 * _channel(c.b);

double contrast(Color a, Color b) {
  final la = _luminance(a);
  final lb = _luminance(b);
  return (math.max(la, lb) + 0.05) / (math.min(la, lb) + 0.05);
}

void main() {
  final themes = {
    'dark': MmColors.dark,
    'light': MmColors.light,
    'martian': MmColors.martian,
  };

  group('contrast (design/color-and-theme-system.md)', () {
    for (final MapEntry(key: name, value: c) in themes.entries) {
      // Text roles need 4.5:1 on every level they appear on.
      final textLevels = {
        'canvas': c.canvas,
        'surface': c.surface,
        'raised': c.raised,
        'overlay': c.overlay,
      };
      final text = {'text': c.text, 'text2': c.text2, 'text3': c.text3};
      for (final t in text.entries) {
        for (final l in textLevels.entries) {
          test('$name: ${t.key} on ${l.key} is at least 4.5:1', () {
            expect(contrast(t.value, l.value), greaterThanOrEqualTo(4.5));
          });
        }
      }

      // Graphics, icons and the colors used as text on surfaces need 3:1;
      // those used as text need 4.5.
      final onSurface = {
        'ember': (c.ember, 4.5),
        'ion': (c.ion, 4.5),
        'info': (c.info, 4.5),
        'caution': (c.caution, 4.5),
        'danger': (c.danger, 4.5),
        'positive': (c.positive, 4.5),
        'protein': (c.protein, 3.0),
        'carbs': (c.carbs, 3.0),
        'fat': (c.fat, 3.0),
        'outlineStrong': (c.outlineStrong, 3.0),
      };
      for (final e in onSurface.entries) {
        for (final level in ['surface', 'raised']) {
          final bg = level == 'surface' ? c.surface : c.raised;
          final (color, minimum) = e.value;
          test('$name: ${e.key} on $level is at least $minimum:1', () {
            expect(contrast(color, bg), greaterThanOrEqualTo(minimum));
          });
        }
      }

      test('$name: filled controls are readable', () {
        expect(contrast(c.onEmber, c.ember), greaterThanOrEqualTo(4.5));
        expect(contrast(c.onIon, c.ion), greaterThanOrEqualTo(4.5));
        expect(contrast(c.onDanger, c.danger), greaterThanOrEqualTo(4.5));
      });

      test('$name: macro bars read against their track', () {
        for (final m in [c.protein, c.carbs, c.fat]) {
          expect(contrast(m, c.track), greaterThanOrEqualTo(3.0));
        }
        expect(contrast(c.energy, c.track), greaterThanOrEqualTo(3.0));
      });

      test('$name: the selected nav label keeps its contrast', () {
        expect(contrast(c.ember, c.selected), greaterThanOrEqualTo(4.0));
        expect(contrast(c.text, c.selected), greaterThanOrEqualTo(4.5));
      });
    }
  });

  group('macros without color vision', () {
    // Lightness (CIE L*) must differ so the bars separate in grayscale.
    double lightness(Color c) {
      final y = _luminance(c);
      return y > 0.008856
          ? 116 * math.pow(y, 1 / 3).toDouble() - 16
          : 903.3 * y;
    }

    for (final MapEntry(key: name, value: c) in themes.entries) {
      test('$name: protein, carbs and fat differ by at least 10 L*', () {
        final l = [lightness(c.protein), lightness(c.carbs), lightness(c.fat)]
          ..sort();
        expect(l[1] - l[0], greaterThanOrEqualTo(10));
        expect(l[2] - l[1], greaterThanOrEqualTo(10));
      });
    }
  });

  group('the theme', () {
    test('Martian is explicit, dark, retro-shaped and has no action glow', () {
      final theme = mmTheme(Brightness.dark, martian: true);
      expect(theme.extension<MmColors>(), MmColors.martian);
      expect(theme.colorScheme.brightness, Brightness.dark);
      expect(theme.colorScheme.primary, MmColors.martian.ember);
      expect(theme.colorScheme.surfaceTint, Colors.transparent);
      expect(theme.floatingActionButtonTheme.elevation, 0);
      expect(theme.floatingActionButtonTheme.hoverElevation, 0);
      expect(theme.floatingActionButtonTheme.focusElevation, 0);
      expect(theme.floatingActionButtonTheme.highlightElevation, 0);
      expect(
        (theme.cardTheme.shape! as RoundedRectangleBorder).borderRadius,
        BorderRadius.circular(12),
      );
      expect(
        (theme.navigationBarTheme.indicatorShape! as RoundedRectangleBorder)
            .borderRadius,
        BorderRadius.circular(8),
      );
    });
    test('both themes carry the same extension and a flat scheme', () {
      for (final b in Brightness.values) {
        final theme = mmTheme(b);
        expect(theme.extension<MmColors>(), isNotNull);
        expect(theme.colorScheme.surfaceTint, Colors.transparent);
        expect(theme.colorScheme.brightness, b);
      }
    });

    test('Ember is the primary color in both', () {
      expect(mmTheme(Brightness.dark).colorScheme.primary, MmColors.dark.ember);
      expect(
        mmTheme(Brightness.light).colorScheme.primary,
        MmColors.light.ember,
      );
    });
  });

  group('no stray colors (MM-102)', () {
    final sources = [
      for (final f in Directory('lib/src').listSync(recursive: true))
        if (f is File &&
            f.path.endsWith('.dart') &&
            !f.path.replaceAll(r'\', '/').contains('/theme/'))
          f,
    ];

    test('screens and widgets contain no literal colors or seed palettes', () {
      final offenders = <String>[];
      final pattern = RegExp(r'Color\(\s*0x|fromSeed|colorSchemeSeed');
      for (final f in sources) {
        if (pattern.hasMatch(f.readAsStringSync())) offenders.add(f.path);
      }
      expect(offenders, isEmpty);
    });

    test('Ember is never tinted', () {
      final offenders = <String>[];
      final pattern = RegExp(
        r'(ember|primary)\s*\.\s*(withValues|withOpacity|withAlpha)',
      );
      for (final f in sources) {
        if (pattern.hasMatch(f.readAsStringSync())) offenders.add(f.path);
      }
      expect(offenders, isEmpty);
    });
  });
}
