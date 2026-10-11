/// Tells the user a rest is over (MM-191), while the app is open. It makes
/// no noise the phone's own settings would not allow.
abstract interface class RestSignal {
  void restOver();
}
