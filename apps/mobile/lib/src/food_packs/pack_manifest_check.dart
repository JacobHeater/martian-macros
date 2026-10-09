import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'food_pack_providers.dart';
import 'pack_manifest_state.dart';

/// Reads the list of available packs, once, when the user asks.
class PackManifestCheck extends Notifier<PackManifestState> {
  @override
  PackManifestState build() => const PackManifestState.idle();

  Future<void> check() async {
    final url = ref.read(packManifestUrlProvider);
    if (url.isEmpty || state.checking) return;
    state = const PackManifestState.checking();
    try {
      final response = await ref.read(packHttpProvider).get(Uri.parse(url));
      if (response.statusCode != 200) {
        response.abort();
        state = PackManifestState.failed(
          'The host answered with an error (${response.statusCode}).',
        );
        return;
      }
      final bytes = <int>[];
      await for (final chunk in response.body) {
        bytes.addAll(chunk);
        if (bytes.length > 1024 * 1024) {
          response.abort();
          state = const PackManifestState.failed('The list was too large.');
          return;
        }
      }
      state = PackManifestState.loaded(PackManifest.parse(utf8.decode(bytes)));
    } on FormatException {
      state = const PackManifestState.failed('The list could not be read.');
    } on IOException {
      state = const PackManifestState.failed('The host could not be reached.');
    }
  }
}
