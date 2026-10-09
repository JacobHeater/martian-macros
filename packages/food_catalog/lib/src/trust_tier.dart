/// How much a food's numbers can be relied on, in words the app can show.
/// No tier is ever called "verified" (MM-153).
enum TrustTier {
  /// From a reference database of analysed foods.
  reference(0),

  /// Transcribed from a product label.
  label(1),

  /// Crowd-entered or conflicting; the user should check it.
  checkThis(2);

  const TrustTier(this.code);

  /// What the pack stores.
  final int code;

  static TrustTier fromCode(int code) => values.firstWhere(
    (t) => t.code == code,
    orElse: () => TrustTier.checkThis,
  );
}
