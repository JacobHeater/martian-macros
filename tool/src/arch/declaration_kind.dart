/// What a top-level declaration is, for the one-declaration-per-file rule.
enum DeclarationKind {
  /// A class, mixin or enum.
  type,

  /// An `extension` or `extension type`.
  extension,

  /// A `typedef`.
  typedef,
}
