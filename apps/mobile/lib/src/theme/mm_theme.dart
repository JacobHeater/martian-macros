import 'package:flutter/material.dart';

import 'mm_colors.dart';
import 'mm_radius.dart';

/// The light or dark theme. Both are built from the same roles; there is no
/// seed palette, so no Material-generated tint can reach a screen.
ThemeData mmTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  final c = dark ? MmColors.dark : MmColors.light;

  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.ember,
    onPrimary: c.onEmber,
    primaryContainer: c.selected,
    onPrimaryContainer: c.text,
    secondary: c.ion,
    onSecondary: c.onIon,
    secondaryContainer: c.selected,
    onSecondaryContainer: c.text,
    tertiary: c.ion,
    onTertiary: c.onIon,
    tertiaryContainer: c.sunken,
    onTertiaryContainer: c.text,
    error: c.danger,
    onError: c.onDanger,
    errorContainer: c.sunken,
    onErrorContainer: c.text,
    surface: c.surface,
    onSurface: c.text,
    onSurfaceVariant: c.text2,
    outline: c.outlineStrong,
    outlineVariant: c.outline,
    shadow: const Color(0xFF000000),
    scrim: const Color(0xFF000000),
    inverseSurface: c.text,
    onInverseSurface: c.canvas,
    inversePrimary: c.ember,
    surfaceTint: Colors.transparent,
    surfaceContainerLowest: c.canvas,
    surfaceContainerLow: c.surface,
    surfaceContainer: c.surface,
    surfaceContainerHigh: c.raised,
    surfaceContainerHighest: c.overlay,
  );

  RoundedRectangleBorder rounded(double radius, [BorderSide? side]) =>
      RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radius),
        side: side ?? BorderSide.none,
      );

  final base = ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.canvas,
    extensions: [c],
  );

  return base.copyWith(
    appBarTheme: AppBarTheme(
      backgroundColor: c.canvas,
      foregroundColor: c.text,
      surfaceTintColor: Colors.transparent,
      scrolledUnderElevation: 0,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: c.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: rounded(MmRadius.group, BorderSide(color: c.outline)),
    ),
    dividerTheme: DividerThemeData(color: c.outline, thickness: 1, space: 1),
    navigationBarTheme: NavigationBarThemeData(
      height: 72,
      backgroundColor: c.raised,
      surfaceTintColor: Colors.transparent,
      indicatorColor: c.selected,
      indicatorShape: const StadiumBorder(),
      elevation: 0,
      iconTheme: WidgetStateProperty.resolveWith(
        (states) => IconThemeData(
          color: states.contains(WidgetState.selected) ? c.ember : c.text2,
        ),
      ),
      labelTextStyle: WidgetStateProperty.resolveWith(
        (states) => TextStyle(
          fontSize: 12,
          height: 16 / 12,
          fontWeight: states.contains(WidgetState.selected)
              ? FontWeight.w700
              : FontWeight.w500,
          color: states.contains(WidgetState.selected) ? c.ember : c.text2,
        ),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: c.ember,
      foregroundColor: c.onEmber,
      elevation: dark ? 0 : 3,
      focusElevation: dark ? 0 : 4,
      hoverElevation: dark ? 0 : 4,
      highlightElevation: dark ? 0 : 3,
      extendedPadding: const EdgeInsets.symmetric(horizontal: 20),
      shape: rounded(MmRadius.group),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: c.ember,
        foregroundColor: c.onEmber,
        minimumSize: const Size(64, 48),
        shape: rounded(MmRadius.control),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: c.text,
        minimumSize: const Size(64, 48),
        side: BorderSide(color: c.outlineStrong),
        shape: rounded(MmRadius.control),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: c.ember,
        minimumSize: const Size(48, 48),
        shape: rounded(MmRadius.control),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: c.sunken,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MmRadius.control),
        borderSide: BorderSide(color: c.outlineStrong),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MmRadius.control),
        borderSide: BorderSide(color: c.outlineStrong),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MmRadius.control),
        borderSide: BorderSide(color: c.text, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MmRadius.control),
        borderSide: BorderSide(color: c.danger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(MmRadius.control),
        borderSide: BorderSide(color: c.danger, width: 2),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: SegmentedButton.styleFrom(
        backgroundColor: c.surface,
        foregroundColor: c.text2,
        selectedBackgroundColor: c.selected,
        selectedForegroundColor: c.ember,
        side: BorderSide(color: c.outlineStrong),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: c.surface,
      selectedColor: c.selected,
      side: BorderSide(color: c.outlineStrong),
      shape: rounded(MmRadius.chip),
    ),
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith(
        (states) =>
            states.contains(WidgetState.selected) ? c.onEmber : c.outlineStrong,
      ),
      trackColor: WidgetStateProperty.resolveWith(
        (states) => states.contains(WidgetState.selected) ? c.ember : c.track,
      ),
      trackOutlineColor: WidgetStateProperty.resolveWith(
        (states) =>
            states.contains(WidgetState.selected) ? c.ember : c.outlineStrong,
      ),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: c.raised,
      surfaceTintColor: Colors.transparent,
      showDragHandle: true,
      dragHandleColor: c.outlineStrong,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(MmRadius.sheetTop),
        ),
      ),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: c.overlay,
      surfaceTintColor: Colors.transparent,
      shape: rounded(MmRadius.group),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: c.overlay,
      contentTextStyle: TextStyle(color: c.text),
      actionTextColor: c.ember,
      behavior: SnackBarBehavior.floating,
      shape: rounded(MmRadius.control),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(
      color: c.energy,
      linearTrackColor: c.track,
      circularTrackColor: c.track,
      linearMinHeight: 8,
      borderRadius: BorderRadius.circular(4),
    ),
    listTileTheme: ListTileThemeData(iconColor: c.text2, textColor: c.text),
  );
}
