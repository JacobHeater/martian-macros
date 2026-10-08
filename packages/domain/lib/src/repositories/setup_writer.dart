import '../user_setup.dart';

/// Saves the user's setup, replacing any existing one.
abstract interface class SetupWriter {
  Future<void> saveSetup(UserSetup setup);
}
