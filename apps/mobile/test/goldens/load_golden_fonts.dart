import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/services.dart';

/// Loads the real fonts for screenshot tests. A widget test draws every font
/// as solid blocks unless the fonts are loaded by hand, which would make the
/// images useless for judging the design.
Future<void> loadGoldenFonts() async {
  Future<void> load(String family, String path) async {
    final bytes = await File(path).readAsBytes();
    final loader = FontLoader(family)
      ..addFont(Future.value(ByteData.view(Uint8List.fromList(bytes).buffer)));
    await loader.load();
  }

  await load('Inter', 'assets/fonts/Inter.ttf');
  await load('SpaceGrotesk', 'assets/fonts/SpaceGrotesk.ttf');

  final flutterRoot = Platform.environment['FLUTTER_ROOT'];
  if (flutterRoot != null) {
    await load(
      'MaterialIcons',
      '$flutterRoot/bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf',
    );
  }
}
