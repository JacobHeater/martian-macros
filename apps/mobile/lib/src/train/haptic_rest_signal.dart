import 'package:flutter/services.dart';
import 'package:mm_domain/mm_domain.dart';

/// Signals the end of a rest with one vibration (MM-191). The system
/// decides whether the phone vibrates, so its own settings are respected.
final class HapticRestSignal implements RestSignal {
  const HapticRestSignal();

  @override
  void restOver() => HapticFeedback.vibrate();
}
