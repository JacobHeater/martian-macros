import 'dart:typed_data';

import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

Uint8List _bytes(List<int> v) => Uint8List.fromList(v);

/// What every [BackupStorage] must do.
void backupStorageContract(String name, BackupStorage Function() create) {
  group('$name as a BackupStorage', () {
    late BackupStorage storage;
    setUp(() => storage = create());

    Future<List<String>> names() async =>
        (await storage.list() as Succeeded<List<String>>).value;

    test('starts empty', () async {
      expect(await names(), isEmpty);
    });

    test('returns what was stored, byte for byte', () async {
      expect(
        await storage.put('a.bin', _bytes([1, 2, 3])),
        isA<Succeeded<void>>(),
      );
      final got = await storage.get('a.bin') as Succeeded<Uint8List>;
      expect(got.value, [1, 2, 3]);
    });

    test('storing under an existing name replaces it', () async {
      await storage.put('a.bin', _bytes([1]));
      await storage.put('a.bin', _bytes([9, 9]));
      final got = await storage.get('a.bin') as Succeeded<Uint8List>;
      expect(got.value, [9, 9]);
      expect(await names(), ['a.bin']);
    });

    test('lists names sorted', () async {
      await storage.put('b.bin', _bytes([1]));
      await storage.put('a.bin', _bytes([1]));
      expect(await names(), ['a.bin', 'b.bin']);
    });

    test('a missing blob is NotFound, not an error', () async {
      expect(await storage.get('nope'), isA<NotFound<Uint8List>>());
    });

    test('delete removes a blob; deleting a missing one succeeds', () async {
      await storage.put('a.bin', _bytes([1]));
      expect(await storage.delete('a.bin'), isA<Succeeded<void>>());
      expect(await storage.delete('a.bin'), isA<Succeeded<void>>());
      expect(await names(), isEmpty);
    });

    test('a stored blob is not changed by changing the original', () async {
      final original = _bytes([1, 2, 3]);
      await storage.put('a.bin', original);
      original[0] = 99;
      final got = await storage.get('a.bin') as Succeeded<Uint8List>;
      expect(got.value, [1, 2, 3]);
    });
  });
}
