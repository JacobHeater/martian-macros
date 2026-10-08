import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'src/app/martian_macros_app.dart';

void main() {
  runApp(const ProviderScope(child: MartianMacrosApp()));
}
