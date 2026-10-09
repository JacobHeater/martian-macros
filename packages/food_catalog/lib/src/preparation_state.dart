/// Whether a food is described as bought, raw or cooked (MM-43).
enum PreparationState {
  unspecified(0),
  raw(1),
  cooked(2),
  packaged(3);

  const PreparationState(this.code);

  /// What the pack stores.
  final int code;

  static PreparationState fromCode(int code) => values.firstWhere(
    (s) => s.code == code,
    orElse: () => PreparationState.unspecified,
  );
}
