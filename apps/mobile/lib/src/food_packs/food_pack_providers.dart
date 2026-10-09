import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:path_provider/path_provider.dart';

import 'pack_download_controller.dart';
import 'pack_download_state.dart';
import 'pack_manifest_check.dart';
import 'pack_manifest_state.dart';

/// Where to read the list of downloadable packs, set per build with
/// `--dart-define-from-file`. Empty means this build offers no downloads and
/// makes no request.
const _manifestUrl = String.fromEnvironment('MM_FOOD_PACK_MANIFEST_URL');

final packManifestUrlProvider = Provider<String>((ref) => _manifestUrl);

/// The network, as far as packs are concerned. Tests replace it with
/// [InMemoryPackHttp].
final packHttpProvider = Provider<PackHttp>((ref) => DartPackHttp());

/// Where downloaded packs are kept (not the user's database).
final packStoreProvider = FutureProvider<PackStore>((ref) async {
  final support = await getApplicationSupportDirectory();
  return PackStore(Directory('${support.path}/food_packs'));
});

/// Packs on this phone, read again whenever one is installed or removed.
final installedPacksProvider = FutureProvider<List<InstalledPack>>((ref) async {
  final store = await ref.watch(packStoreProvider.future);
  if (!store.root.existsSync()) return const [];
  return [
    for (final file in store.root.listSync().whereType<File>())
      if (file.path.endsWith('.pack'))
        ?store.installed(
          file.uri.pathSegments.last.replaceFirst(RegExp(r'\.pack$'), ''),
        ),
  ];
});

final packManifestProvider =
    NotifierProvider<PackManifestCheck, PackManifestState>(
      PackManifestCheck.new,
    );

final packDownloadControllerProvider =
    NotifierProvider<PackDownloadController, PackDownloadState>(
      PackDownloadController.new,
    );
