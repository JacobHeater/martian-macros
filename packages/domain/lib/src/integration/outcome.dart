/// The result of asking an outside provider for something.
///
/// Every integration seam returns this, so consumers handle the same four
/// cases whichever provider is behind it, and a fixture can simulate each.
///
/// The cases are `part` files of this library: Dart requires the subtypes of
/// a sealed class to share its library, and the repository rule is one
/// declaration per file.
library;

part 'denied.dart';
part 'not_found.dart';
part 'succeeded.dart';
part 'unavailable.dart';

sealed class Outcome<T> {
  const Outcome();
}
