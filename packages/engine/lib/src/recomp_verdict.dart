/// What a recomp review found (MM-133).
enum RecompVerdict {
  /// Waist down, strength up or held: what a recomp looks like.
  working,

  /// Weight down more than 2% with strength held: a fat loss, and a fine
  /// one, by another name.
  slowCut,

  /// No clear change in waist, strength up: the earliest signal is there.
  probablyWorking,

  /// Nothing has moved the right way.
  notWorking,

  /// The same at the first review, where it is too soon to call it.
  tooEarly,
}
