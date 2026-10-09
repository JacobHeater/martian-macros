/// What a text field collects, which sets its keyboard and capitalization.
enum MmTextFieldKind {
  text,
  number,

  /// An amount such as 1.5 or 1/2: a keyboard that has the slash.
  quantity,
}
