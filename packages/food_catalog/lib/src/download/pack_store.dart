import 'dart:convert';
import 'dart:io';

import 'installed_pack.dart';

/// Where downloaded packs live, kept apart from the user's own data: a pack is
/// read-only, replaceable, and never part of a backup.
final class PackStore {
  PackStore(this.root);

  final Directory root;

  File installedFile(String id) => File('${root.path}/$id.pack');
  File _metaFile(String id) => File('${root.path}/$id.json');

  /// Where an unfinished download of [version] is kept, so it can resume.
  File partialFile(String id, String version) =>
      File('${root.path}/$id.$version.part');

  File stagingFile(String id) => File('${root.path}/$id.new');

  /// The installed pack [id], or null.
  InstalledPack? installed(String id) {
    final file = installedFile(id);
    final meta = _metaFile(id);
    if (!file.existsSync() || !meta.existsSync()) return null;
    try {
      final json = jsonDecode(meta.readAsStringSync()) as Map<String, Object?>;
      return InstalledPack(
        id: id,
        version: json['version']! as String,
        path: file.path,
        bytes: file.lengthSync(),
      );
    } on Object {
      return null;
    }
  }

  /// Bytes already downloaded of an unfinished [version], or 0.
  int partialBytes(String id, String version) {
    final file = partialFile(id, version);
    return file.existsSync() ? file.lengthSync() : 0;
  }

  /// Puts the checked, unpacked [staged] file in place of any earlier pack. The
  /// earlier pack is kept until the new one is in place, so a failure here
  /// leaves it working.
  void commit(String id, File staged, String version) {
    root.createSync(recursive: true);
    final target = installedFile(id);
    final backup = File('${target.path}.old');
    if (backup.existsSync()) backup.deleteSync();
    if (target.existsSync()) target.renameSync(backup.path);
    try {
      staged.renameSync(target.path);
      _metaFile(id).writeAsStringSync(jsonEncode({'version': version}));
    } on Object {
      if (backup.existsSync()) {
        if (target.existsSync()) target.deleteSync();
        backup.renameSync(target.path);
      }
      rethrow;
    }
    if (backup.existsSync()) backup.deleteSync();
  }

  /// Removes the pack [id] and anything left from downloading it.
  void remove(String id) {
    if (!root.existsSync()) return;
    for (final entity in root.listSync().whereType<File>()) {
      final name = entity.uri.pathSegments.last;
      if (name == '$id.pack' ||
          name == '$id.json' ||
          name == '$id.new' ||
          name == '$id.pack.old' ||
          (name.startsWith('$id.') && name.endsWith('.part'))) {
        entity.deleteSync();
      }
    }
  }

  /// Deletes an unfinished download without touching the installed pack.
  void discardPartial(String id, String version) {
    final file = partialFile(id, version);
    if (file.existsSync()) file.deleteSync();
  }
}
