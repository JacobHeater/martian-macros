import 'dart:convert';
import 'dart:io';

import 'package:test/test.dart';

import '../src/ui_ux_assets.dart';
import '../src/ui_ux_coverage.dart';

/// MM-211: every view and component has an HTML drawing, and the manifest
/// that says so is checked against the source.
void main() {
  late Directory root;

  void put(String path, String content) {
    File('${root.path}/$path')
      ..createSync(recursive: true)
      ..writeAsStringSync(content);
  }

  Map<String, Object?> entry({
    String source = 'apps/mobile/lib/src/coach/coach_screen.dart',
    String symbol = 'CoachScreen',
    String asset = 'views/coach.html#coach-default',
    Object? requirements = const ['MM-24'],
    String status = 'covered',
    String? limits,
  }) => {
    'source': source,
    'symbol': symbol,
    'kind': 'view',
    'requirements': requirements,
    'asset': asset,
    'states': ['populated'],
    'verification': 'source-only',
    'status': status,
    'limits': ?limits,
  };

  void manifest(
    List<Map<String, Object?>> surfaces, {
    List<Map<String, Object?>> flows = const [],
    List<Map<String, Object?>> unresolved = const [],
  }) => put(
    uiUxCoverageFile,
    jsonEncode({
      'schema': 1,
      'surfaces': surfaces,
      'flows': flows,
      'unresolved': unresolved,
    }),
  );

  List<String> problems() =>
      uiUxCoverageProblems(root, ticketIds: {'MM-24', 'MM-104'});

  setUp(() {
    root = Directory.systemTemp.createTempSync('mm_ui_ux_coverage');
    put(
      'apps/mobile/lib/src/coach/coach_screen.dart',
      'class CoachScreen extends ConsumerWidget {}',
    );
    put(
      'apps/mobile/lib/src/coach/coach_text.dart',
      "String coachText() => 'x';",
    );
    put(
      '$uiUxAssetsFolder/views/coach.html',
      "<script>m.frame('coach-default', 'Coach', '', '')</script>",
    );
    put('$uiUxAssetsFolder/index.html', '<a href="views/coach.html">Coach</a>');
    manifest([entry()]);
  });

  tearDown(() => root.deleteSync(recursive: true));

  test('a widget file with its entry and its frame is fine', () {
    expect(problems(), isEmpty);
  });

  group('what draws something', () {
    test('widgets, painters and show functions do; the rest does not', () {
      put(
        'apps/mobile/lib/src/ui/mm_dropdown.dart',
        'class MmDropdown<T> extends StatelessWidget {}',
      );
      put(
        'apps/mobile/lib/src/ui/arc_painter.dart',
        'final class ArcPainter extends CustomPainter {}',
      );
      put(
        'apps/mobile/lib/src/ui/show_mm_confirm.dart',
        'Future<bool> showMmConfirm(BuildContext context) async => true;',
      );
      put(
        'apps/mobile/lib/src/ui/show_mm_snack_bar.dart',
        'void showMmSnackBar(Object messenger) {}',
      );
      put(
        'apps/mobile/lib/src/coach/coach_screen_state.dart',
        'class CoachScreenState extends ConsumerState<CoachScreen> {}',
      );
      put(
        'apps/mobile/lib/src/coach/coach.g.dart',
        'class Generated extends StatelessWidget {}',
      );
      expect(uiSurfaceSources(root), [
        'apps/mobile/lib/src/coach/coach_screen.dart',
        'apps/mobile/lib/src/ui/arc_painter.dart',
        'apps/mobile/lib/src/ui/mm_dropdown.dart',
        'apps/mobile/lib/src/ui/show_mm_confirm.dart',
        'apps/mobile/lib/src/ui/show_mm_snack_bar.dart',
      ]);
    });
  });

  test('a new widget file that is not listed is reported', () {
    put(
      'apps/mobile/lib/src/coach/new_card.dart',
      'class NewCard extends StatelessWidget {}',
    );
    expect(
      problems().single,
      allOf(contains('coach/new_card.dart'), contains('is not listed')),
    );
  });

  test('a removed widget file still listed is reported', () {
    manifest([
      entry(),
      entry(source: 'apps/mobile/lib/src/coach/gone.dart', symbol: 'Gone'),
    ]);
    expect(
      problems().single,
      allOf(contains('coach/gone.dart'), contains('no longer exists')),
    );
  });

  test('a file listed twice is reported', () {
    manifest([entry(), entry()]);
    expect(problems().single, contains('is listed twice'));
  });

  test('a symbol the file does not declare is reported', () {
    manifest([entry(symbol: 'CoachPage')]);
    expect(problems().single, contains('does not declare "CoachPage"'));
  });

  test('a sheet that does not exist is reported', () {
    manifest([entry(asset: 'views/gone.html#coach-default')]);
    expect(problems().single, contains('views/gone.html is missing'));
  });

  test('a frame the sheet does not have is reported', () {
    manifest([entry(asset: 'views/coach.html#coach-renamed')]);
    expect(
      problems().single,
      allOf(contains('views/coach.html'), contains('no frame "coach-renamed"')),
    );
  });

  test('an asset without a frame is reported', () {
    manifest([entry(asset: 'views/coach.html')]);
    expect(problems().single, contains('must be "file.html#frame"'));
  });

  test('a frame may be an element id as well as a drawn frame', () {
    put('$uiUxAssetsFolder/views/coach.html', '<h2 id="coach-default">x</h2>');
    expect(problems(), isEmpty);
  });

  test('two files may share one frame', () {
    put(
      'apps/mobile/lib/src/coach/reports_card.dart',
      'class ReportsCard extends ConsumerWidget {}',
    );
    manifest([
      entry(),
      entry(
        source: 'apps/mobile/lib/src/coach/reports_card.dart',
        symbol: 'ReportsCard',
      ),
    ]);
    expect(problems(), isEmpty);
  });

  test('a requirement no ticket has is reported', () {
    manifest([
      entry(requirements: ['MM-24', 'MM-999']),
    ]);
    expect(problems().single, contains('names MM-999, which no ticket has'));
  });

  test('an entry with no requirement is reported', () {
    manifest([entry(requirements: const <String>[])]);
    expect(problems().single, contains('lists no requirements'));
  });

  test('not drawn needs a reason; with one it is fine', () {
    manifest([entry(status: 'not-drawn')]);
    expect(problems().single, contains('does not say why under "limits"'));
    manifest([entry(status: 'not-drawn', limits: 'It draws nothing itself.')]);
    expect(problems(), isEmpty);
  });

  test('unknown kind, verification and status are reported', () {
    manifest([
      {
        ...entry(),
        'kind': 'screen',
        'verification': 'looked',
        'status': 'done',
        'limits': 'x',
      },
    ]);
    expect(problems(), hasLength(3));
  });

  test('an entry with no states is reported', () {
    manifest([
      {...entry(), 'states': <String>[]},
    ]);
    expect(problems().single, contains('lists no states'));
  });

  test('a flow is checked like a surface', () {
    manifest(
      [entry()],
      flows: [
        {
          'id': 'check-in',
          'requirements': ['MM-24'],
          'asset': 'views/coach.html#coach-default',
        },
        {
          'id': 'lost',
          'requirements': ['MM-24'],
          'asset': 'views/coach.html#nowhere',
        },
      ],
    );
    expect(problems().single, contains('flow lost'));
  });

  test('an unresolved item says what must be decided', () {
    manifest(
      [entry()],
      unresolved: [
        {'what': 'A card nobody asked for', 'decision': 'Which ticket?'},
      ],
    );
    expect(problems(), isEmpty);
    manifest(
      [entry()],
      unresolved: [
        {'what': 'A card nobody asked for'},
      ],
    );
    expect(problems().single, contains('"decision"'));
  });

  test('a sheet the index does not link is reported', () {
    put('$uiUxAssetsFolder/index.html', '<p>Nothing yet</p>');
    expect(
      problems().single,
      contains('index.html does not link views/coach.html'),
    );
  });

  test('a missing index is reported', () {
    File('${root.path}/$uiUxAssetsFolder/index.html').deleteSync();
    expect(problems().single, contains('index.html is missing'));
  });

  test('widgets with no manifest at all are reported', () {
    File('${root.path}/$uiUxCoverageFile').deleteSync();
    expect(problems().single, contains('coverage.json is missing'));
  });

  test('a manifest that is not JSON is reported, not thrown', () {
    put(uiUxCoverageFile, '{ not json');
    expect(problems().single, contains('not valid JSON'));
    put(uiUxCoverageFile, '{"schema": 2}');
    expect(problems().single, contains('"schema": 1'));
  });

  group('links to frames', () {
    void ticket(String link) => put(
      'requirements/coach/STORY.coach.MM-24.md',
      '---\nid: MM-24\nstatus: done\ncomponent: coach\n---\n\n# Story\n\n'
          '## UI/UX Assets\n\n- [Coach]($link) — Current. The Coach screen.\n',
    );

    setUp(() {
      put(
        '$uiUxAssetsFolder/README.md',
        '# Assets\n\n## Unresolved assets\n\n- [Index](index.html): the way '
            'in. Decide nothing.\n',
      );
    });

    test('a ticket may link a frame that exists', () {
      ticket('../ui-ux-assets/views/coach.html#coach-default');
      expect(uiUxAssetProblems(root), isEmpty);
    });

    test('a ticket linking a frame that does not exist is reported', () {
      ticket('../ui-ux-assets/views/coach.html#no-such-frame');
      expect(
        uiUxAssetProblems(root).single,
        allOf(
          contains('coach/STORY.coach.MM-24.md'),
          contains('no frame "no-such-frame"'),
        ),
      );
    });

    test('a sheet linking a frame another sheet lacks is reported', () {
      ticket('../ui-ux-assets/views/coach.html#coach-default');
      put(
        '$uiUxAssetsFolder/index.html',
        '<a href="views/coach.html#coach-gone">Coach</a>',
      );
      expect(
        uiUxAssetProblems(root).single,
        allOf(contains('index.html'), contains('no frame "coach-gone"')),
      );
    });
  });

  test('this repository lists every widget file and every frame exists', () {
    final here = Directory.current.path.replaceAll('\\', '/');
    final top = here.endsWith('/tool')
        ? Directory(here.substring(0, here.length - 5))
        : Directory.current;
    final ids = <String>{};
    for (final file in Directory(
      '${top.path}/requirements',
    ).listSync(recursive: true).whereType<File>()) {
      final id = RegExp(r'\.(MM-\d+)\.md$').firstMatch(file.path);
      if (id != null) ids.add(id[1]!);
    }
    expect(uiSurfaceSources(top), isNotEmpty);
    expect(uiUxCoverageProblems(top, ticketIds: ids), isEmpty);
  });
}
