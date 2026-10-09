import 'dart:convert';
import 'dart:io';

import 'food_source.dart';

/// Downloads each source into [cache] (reusing what is already there) and
/// unpacks the zip files, then writes `provenance.json` with the date and the
/// versions. Returns a process exit code.
Future<int> fetchFoodSources(Directory cache) async {
  cache.createSync(recursive: true);
  final today = DateTime.now().toIso8601String().substring(0, 10);
  final client = HttpClient();
  try {
    for (final source in foodSources) {
      final file = File('${cache.path}/${source.fileName}');
      if (file.existsSync()) {
        stdout.writeln('reusing ${source.fileName}');
      } else {
        stdout.writeln('downloading ${source.url}');
        final temp = File('${file.path}.part');
        final request = await client.getUrl(Uri.parse(source.url));
        final response = await request.close();
        if (response.statusCode != 200) {
          stderr.writeln('${source.url}: HTTP ${response.statusCode}');
          return 1;
        }
        await response.pipe(temp.openWrite());
        temp.renameSync(file.path);
      }
      if (source.isZip &&
          !Directory('${cache.path}/${source.id}').existsSync()) {
        final code = await _unzip(
          file,
          Directory('${cache.path}/${source.id}'),
        );
        if (code != 0) return code;
      }
    }
  } finally {
    client.close();
  }
  File('${cache.path}/provenance.json').writeAsStringSync(
    jsonEncode({
      'builtOn': today,
      'sources': [
        for (final s in foodSources) '${s.description} (downloaded $today)',
      ],
    }),
  );
  stdout.writeln('sources ready in ${cache.path}');
  return 0;
}

/// Unpacks [zip] into [into], dropping the one folder the USDA zips wrap
/// everything in.
Future<int> _unzip(File zip, Directory into) async {
  into.createSync(recursive: true);
  var result = await Process.run('tar', [
    '-xf',
    zip.path,
    '-C',
    into.path,
    '--strip-components=1',
  ]);
  if (result.exitCode != 0) {
    result = await Process.run('unzip', ['-oq', zip.path, '-d', into.path]);
    if (result.exitCode != 0) {
      stderr.writeln('Could not unzip ${zip.path}: ${result.stderr}');
      into.deleteSync(recursive: true);
      return 1;
    }
    final inner = into.listSync().whereType<Directory>().toList();
    if (inner.length == 1 && into.listSync().length == 1) {
      for (final entity in inner.single.listSync()) {
        entity.renameSync(
          '${into.path}/${entity.uri.pathSegments.where((s) => s.isNotEmpty).last}',
        );
      }
      inner.single.deleteSync();
    }
  }
  return 0;
}
