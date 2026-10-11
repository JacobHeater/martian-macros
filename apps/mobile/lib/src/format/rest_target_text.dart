import 'elapsed_text.dart';

/// A rest target as the user chose it (MM-191): "2:00", or "None".
String restTargetText(Duration? target) =>
    target == null ? 'None' : elapsedText(target);
