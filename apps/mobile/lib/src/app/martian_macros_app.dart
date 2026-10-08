import 'package:flutter/material.dart';

import '../theme/mm_theme.dart';
import 'app_root.dart';

class MartianMacrosApp extends StatelessWidget {
  const MartianMacrosApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Martian Macros',
    debugShowCheckedModeBanner: false,
    theme: mmTheme(Brightness.light),
    darkTheme: mmTheme(Brightness.dark),
    home: const AppRoot(),
  );
}
