import '../user_setup.dart';

/// Reads the user's setup. There is at most one.
abstract interface class SetupReader {
  /// The setup, then every change. Emits null before onboarding.
  Stream<UserSetup?> watchSetup();

  /// The setup now, or null before onboarding.
  Future<UserSetup?> loadSetup();
}
