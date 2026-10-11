import 'package:test/test.dart';

import '../health_data_type.dart';
import '../health_source.dart';

/// What every [HealthSource] must do (MM-67): the fake on any machine and,
/// on a device, each real platform. [create] gives a source the app has
/// permission to read, with whatever readings it happens to hold; the
/// suite assumes none in particular.
void healthSourceContract(String name, Future<HealthSource> Function() create) {
  group('$name is a health source', () {
    late HealthSource source;
    final longAgo = DateTime(2000);
    final farAhead = DateTime(2100);

    setUp(() async => source = await create());

    test('what is permitted is within what is available', () async {
      final available = await source.available();
      expect(available.containsAll(await source.permitted()), isTrue);
    });

    test(
      'asking for a type that is not available does not permit it',
      () async {
        final available = await source.available();
        final missing = HealthDataType.values.toSet().difference(available);
        final after = await source.requestPermission(missing);
        expect(after.intersection(missing), isEmpty);
      },
    );

    test('readings come oldest first, within the range, of the type asked '
        'for, each with an id of its own and a source', () async {
      for (final type in await source.permitted()) {
        final samples = await source.read(type, from: longAgo, to: farAhead);
        expect({
          for (final s in samples) s.platformId,
        }, hasLength(samples.length));
        for (var i = 0; i < samples.length; i++) {
          final sample = samples[i];
          expect(sample.type, type);
          expect(sample.platformId, isNotEmpty);
          expect(sample.sourceId, isNotEmpty);
          expect(sample.start.isBefore(longAgo), isFalse);
          expect(sample.start.isBefore(farAhead), isTrue);
          if (i > 0) {
            expect(sample.start.isBefore(samples[i - 1].start), isFalse);
          }
        }
      }
    });

    test(
      'the end of a range is not in it, and an empty range is empty',
      () async {
        for (final type in await source.permitted()) {
          final all = await source.read(type, from: longAgo, to: farAhead);
          if (all.isEmpty) continue;
          final first = all.first.start;
          expect(await source.read(type, from: longAgo, to: first), isEmpty);
          expect(
            (await source.read(type, from: first, to: farAhead)).first,
            all.first,
          );
          expect(await source.read(type, from: first, to: first), isEmpty);
        }
      },
    );

    test('a type that is not permitted reads as nothing', () async {
      final permitted = await source.permitted();
      for (final type in HealthDataType.values) {
        if (permitted.contains(type)) continue;
        expect(await source.read(type, from: longAgo, to: farAhead), isEmpty);
        expect((await source.changesSince(type, null)).upserted, isEmpty);
      }
    });

    test(
      'with no token, the changes are everything, and come with a token',
      () async {
        for (final type in await source.permitted()) {
          final changes = await source.changesSince(type, null);
          expect(changes.tokenExpired, isFalse);
          expect(changes.nextToken, isNotEmpty);
          expect(changes.deletedIds, isEmpty);
          expect(
            {for (final s in changes.upserted) s.platformId},
            {
              for (final s in await source.read(
                type,
                from: longAgo,
                to: farAhead,
              ))
                s.platformId,
            },
          );
        }
      },
    );

    test('asked again at once, nothing has changed', () async {
      for (final type in await source.permitted()) {
        final first = await source.changesSince(type, null);
        final again = await source.changesSince(type, first.nextToken);
        expect(again.tokenExpired, isFalse);
        expect(again.upserted, isEmpty);
        expect(again.deletedIds, isEmpty);
      }
    });

    test('a token that was never issued is expired, not an error', () async {
      for (final type in await source.permitted()) {
        final changes = await source.changesSince(type, 'not a token');
        expect(changes.tokenExpired, isTrue);
        expect(changes.upserted, isEmpty);
      }
    });
  });
}
