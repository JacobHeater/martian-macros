/// How one of the three things a recomp signal rests on stands (MM-32).
enum RecompPart {
  /// As a recomp would show it: weight flat, waist down, strength up.
  holds,

  /// Measured, and not so: or not clearly so.
  doesNotHold,

  /// Not enough was logged to say.
  unknown,
}
