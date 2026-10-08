import 'package:flutter/material.dart';

/// Shows a short message at the bottom of the screen.
void showMmSnackBar(ScaffoldMessengerState messenger, String message) {
  messenger.showSnackBar(SnackBar(content: Text(message)));
}
