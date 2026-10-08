import 'package:flutter/material.dart';

/// The app's colors, by meaning. The values and their measured contrast are in
/// `design/color-and-theme-system.md`; change both together.
///
/// Screens read these through [MmColorsContext.mm]. They never write a
/// `Color(0x…)` and never read a Material role for a meaning.
@immutable
class MmColors extends ThemeExtension<MmColors> {
  const MmColors({
    required this.canvas,
    required this.surface,
    required this.raised,
    required this.overlay,
    required this.sunken,
    required this.track,
    required this.selected,
    required this.outline,
    required this.outlineStrong,
    required this.text,
    required this.text2,
    required this.text3,
    required this.ember,
    required this.onEmber,
    required this.ion,
    required this.onIon,
    required this.energy,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.positive,
    required this.caution,
    required this.info,
    required this.danger,
    required this.onDanger,
  });

  /// Page background.
  final Color canvas;

  /// Grouped content.
  final Color surface;

  /// Navigation bar, sheets, menus.
  final Color raised;

  /// Dialogs and popovers.
  final Color overlay;

  /// Wells, input fills, skeletons.
  final Color sunken;

  /// The empty part of a progress bar.
  final Color track;

  /// A selected row, chip or navigation indicator. Never an Ember tint.
  final Color selected;

  /// Dividers and hairlines (decorative).
  final Color outline;

  /// Control boundaries (3:1 against the surface).
  final Color outlineStrong;

  final Color text;
  final Color text2;
  final Color text3;

  /// The primary action and the current location. Solid only: never tinted,
  /// washed or used as a background wash.
  final Color ember;
  final Color onEmber;

  /// The trend line and anything the engine estimated.
  final Color ion;
  final Color onIon;

  /// The calorie bar and arc.
  final Color energy;

  final Color protein;
  final Color carbs;
  final Color fat;

  /// A permitted achievement. Never for eating or weighing less.
  final Color positive;

  /// Health and safety notices (icon, text or stroke).
  final Color caution;

  /// Explanations (icon, text or stroke).
  final Color info;

  /// Destructive actions only (icon, text or stroke).
  final Color danger;
  final Color onDanger;

  static const dark = MmColors(
    canvas: Color(0xFF090D15),
    surface: Color(0xFF101624),
    raised: Color(0xFF171F32),
    overlay: Color(0xFF1F2A42),
    sunken: Color(0xFF0D1220),
    track: Color(0xFF1F2940),
    selected: Color(0xFF1C2842),
    outline: Color(0xFF2B3853),
    outlineStrong: Color(0xFF5A6A8C),
    text: Color(0xFFECF0F8),
    text2: Color(0xFFA9B4CA),
    text3: Color(0xFF8F9BB5),
    ember: Color(0xFFFF6A45),
    onEmber: Color(0xFF1A0802),
    ion: Color(0xFF3FD8F0),
    onIon: Color(0xFF031A20),
    energy: Color(0xFFECF0F8),
    protein: Color(0xFF5B9DFF),
    carbs: Color(0xFFF6C453),
    fat: Color(0xFF7F57FF),
    positive: Color(0xFF4FDB8A),
    caution: Color(0xFFFFB84D),
    info: Color(0xFF7FB8FF),
    danger: Color(0xFFFF7A7A),
    onDanger: Color(0xFF2A0606),
  );

  static const light = MmColors(
    canvas: Color(0xFFF3F5FA),
    surface: Color(0xFFFFFFFF),
    raised: Color(0xFFFFFFFF),
    overlay: Color(0xFFFFFFFF),
    sunken: Color(0xFFE8ECF5),
    track: Color(0xFFEBEFF7),
    selected: Color(0xFFE3E8F5),
    outline: Color(0xFFCBD3E3),
    outlineStrong: Color(0xFF7C88A3),
    text: Color(0xFF0C1220),
    text2: Color(0xFF46526B),
    text3: Color(0xFF5A6680),
    ember: Color(0xFFCC3210),
    onEmber: Color(0xFFFFFFFF),
    ion: Color(0xFF0A7890),
    onIon: Color(0xFFFFFFFF),
    energy: Color(0xFF0C1220),
    protein: Color(0xFF1646A6),
    carbs: Color(0xFFBF7A00),
    fat: Color(0xFF7448E6),
    positive: Color(0xFF117A3E),
    caution: Color(0xFF8F5600),
    info: Color(0xFF1C62C9),
    danger: Color(0xFFB3261E),
    onDanger: Color(0xFFFFFFFF),
  );

  @override
  MmColors copyWith({
    Color? canvas,
    Color? surface,
    Color? raised,
    Color? overlay,
    Color? sunken,
    Color? track,
    Color? selected,
    Color? outline,
    Color? outlineStrong,
    Color? text,
    Color? text2,
    Color? text3,
    Color? ember,
    Color? onEmber,
    Color? ion,
    Color? onIon,
    Color? energy,
    Color? protein,
    Color? carbs,
    Color? fat,
    Color? positive,
    Color? caution,
    Color? info,
    Color? danger,
    Color? onDanger,
  }) => MmColors(
    canvas: canvas ?? this.canvas,
    surface: surface ?? this.surface,
    raised: raised ?? this.raised,
    overlay: overlay ?? this.overlay,
    sunken: sunken ?? this.sunken,
    track: track ?? this.track,
    selected: selected ?? this.selected,
    outline: outline ?? this.outline,
    outlineStrong: outlineStrong ?? this.outlineStrong,
    text: text ?? this.text,
    text2: text2 ?? this.text2,
    text3: text3 ?? this.text3,
    ember: ember ?? this.ember,
    onEmber: onEmber ?? this.onEmber,
    ion: ion ?? this.ion,
    onIon: onIon ?? this.onIon,
    energy: energy ?? this.energy,
    protein: protein ?? this.protein,
    carbs: carbs ?? this.carbs,
    fat: fat ?? this.fat,
    positive: positive ?? this.positive,
    caution: caution ?? this.caution,
    info: info ?? this.info,
    danger: danger ?? this.danger,
    onDanger: onDanger ?? this.onDanger,
  );

  @override
  MmColors lerp(ThemeExtension<MmColors>? other, double t) {
    if (other is! MmColors) return this;
    Color l(Color a, Color b) => Color.lerp(a, b, t)!;
    return MmColors(
      canvas: l(canvas, other.canvas),
      surface: l(surface, other.surface),
      raised: l(raised, other.raised),
      overlay: l(overlay, other.overlay),
      sunken: l(sunken, other.sunken),
      track: l(track, other.track),
      selected: l(selected, other.selected),
      outline: l(outline, other.outline),
      outlineStrong: l(outlineStrong, other.outlineStrong),
      text: l(text, other.text),
      text2: l(text2, other.text2),
      text3: l(text3, other.text3),
      ember: l(ember, other.ember),
      onEmber: l(onEmber, other.onEmber),
      ion: l(ion, other.ion),
      onIon: l(onIon, other.onIon),
      energy: l(energy, other.energy),
      protein: l(protein, other.protein),
      carbs: l(carbs, other.carbs),
      fat: l(fat, other.fat),
      positive: l(positive, other.positive),
      caution: l(caution, other.caution),
      info: l(info, other.info),
      danger: l(danger, other.danger),
      onDanger: l(onDanger, other.onDanger),
    );
  }
}
