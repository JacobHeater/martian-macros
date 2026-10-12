import 'dart:io';

import 'package:test/test.dart';

import '../src/ui_ux_assets.dart';

/// MM-210: HTML UI/UX assets are kept in the requirements folder and linked
/// from the tickets they support.
void main() {
  late Directory root;

  void put(String path, String content) {
    File('${root.path}/$path')
      ..createSync(recursive: true)
      ..writeAsStringSync(content);
  }

  String ticket(String body) =>
      '---\nid: MM-1\nstatus: done\ncomponent: food\n---\n\n# Story\n\n$body';

  const page = '<!doctype html><title>Entry</title><p>Quantity</p>';
  const entry =
      '- [Entry](../ui-ux-assets/entry.html) — Proposed. The quantity and '
      'unit fields of the food entry screen. Not approved.\n';

  String readme({String unresolved = 'None.', String elsewhere = ''}) =>
      '# UI/UX assets\n\n## Unresolved assets\n\n$unresolved\n\n'
      '## HTML that is not a UI/UX asset\n\n$elsewhere\n';

  List<String> problems({List<String>? htmlFiles}) =>
      uiUxAssetProblems(root, htmlFiles: htmlFiles);

  setUp(() {
    root = Directory.systemTemp.createTempSync('mm_ui_ux_assets');
    put('requirements/ui-ux-assets/README.md', readme());
    put('requirements/ui-ux-assets/entry.html', page);
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket('## UI/UX Assets\n\n$entry'),
    );
  });

  tearDown(() => root.deleteSync(recursive: true));

  test('an asset in the folder, linked from its ticket, is fine', () {
    expect(
      problems(htmlFiles: ['requirements/ui-ux-assets/entry.html']),
      isEmpty,
    );
  });

  test('an entry may run over several lines', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — '
        'Proposed. The quantity\n  and unit fields.\n\n## Notes\n- Other.\n',
      ),
    );
    expect(problems(), isEmpty);
  });

  test('a new asset that no ticket lists is reported', () {
    put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
    expect(
      problems().single,
      allOf(
        contains('requirements/ui-ux-assets/chooser.html'),
        contains('no ticket lists it'),
      ),
    );
  });

  test('a new asset put outside the folder is reported', () {
    put('design/chooser.html', '<p>Chooser</p>');
    expect(
      problems(
        htmlFiles: [
          'design/chooser.html',
          'requirements/ui-ux-assets/entry.html',
        ],
      ).single,
      allOf(contains('design/chooser.html'), contains('move it there')),
    );
  });

  test('HTML that is not an asset is accounted for in the README', () {
    put('roadmap/progress.html', '<p>Report</p>');
    put(
      'requirements/ui-ux-assets/README.md',
      readme(elsewhere: '- `roadmap/progress.html`: a generated report.'),
    );
    expect(problems(htmlFiles: ['roadmap/progress.html']), isEmpty);
  });

  test('a README entry for HTML that is gone is reported', () {
    put(
      'requirements/ui-ux-assets/README.md',
      readme(elsewhere: '- `roadmap/progress.html`: a generated report.'),
    );
    expect(problems().single, contains('is missing. Take it off the list'));
  });

  test('a README entry for other HTML must say what it is', () {
    put('roadmap/progress.html', '<p>Report</p>');
    put(
      'requirements/ui-ux-assets/README.md',
      readme(elsewhere: '- `roadmap/progress.html`'),
    );
    expect(
      problems(htmlFiles: ['roadmap/progress.html']),
      contains(contains('must read')),
    );
  });

  test('with no list of HTML files, the rest is still checked', () {
    put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
    expect(problems().single, contains('no ticket lists it'));
  });

  test('a link to a missing file is reported', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n$entry'
        '- [Gone](../ui-ux-assets/gone.html) — Proposed. A lost page.\n',
      ),
    );
    expect(
      problems().single,
      allOf(
        contains('food/STORY.entry.MM-1.md'),
        contains('requirements/ui-ux-assets/gone.html, which is missing'),
      ),
    );
  });

  test('a link that leaves the folder is reported', () {
    put('design/entry.html', page);
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n$entry'
        '- [Other](../../design/entry.html) — Proposed. Kept elsewhere.\n',
      ),
    );
    expect(problems().single, contains('outside requirements/ui-ux-assets/'));
  });

  test('a link that is not relative is reported', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n$entry'
        '- [Web](https://example.com/entry.html) — Proposed. On a site.\n',
      ),
    );
    expect(problems().single, contains('needs a relative link'));
  });

  test('a status outside the four is reported', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n'
        '- [Entry](../ui-ux-assets/entry.html) — Approved. The fields.\n',
      ),
    );
    expect(
      problems().single,
      allOf(contains('status "Approved"'), contains('exploratory, proposed')),
    );
  });

  test('every status in the convention is accepted', () {
    for (final status in uiUxAssetStatuses) {
      put(
        'requirements/food/STORY.entry.MM-1.md',
        ticket(
          '## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — '
          '${status[0].toUpperCase()}${status.substring(1)}. The fields.\n',
        ),
      );
      expect(problems(), isEmpty, reason: status);
    }
  });

  test('an entry that says nothing about the asset is reported', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n'
        '- [Entry](../ui-ux-assets/entry.html) — Proposed.\n',
      ),
    );
    expect(problems().single, contains('does not say what it shows'));
  });

  test('an entry that is not a link is reported', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket('## UI/UX Assets\n\n$entry- See the entry page.\n'),
    );
    expect(problems().single, contains('an asset entry must read'));
  });

  test('a section that lists nothing is reported', () {
    put('requirements/ui-ux-assets/entry.html', page);
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket('## UI/UX Assets\n\nTo come.\n'),
    );
    expect(problems(), contains(contains('lists no asset')));
  });

  test('a heading that is nearly right is reported', () {
    for (final heading in [
      '## UI/UX assets',
      '### UI/UX Assets',
      '## UI UX Asset',
    ]) {
      put(
        'requirements/food/STORY.entry.MM-1.md',
        ticket('$heading\n\n$entry'),
      );
      expect(
        problems(),
        contains(contains('must be exactly "## UI/UX Assets"')),
        reason: heading,
      );
    }
  });

  test('the heading inside a code example is not a section', () {
    put(
      'requirements/food/STORY.entry.MM-1.md',
      ticket(
        '## UI/UX Assets\n\n$entry\n## Notes\n```markdown\n'
        '## UI/UX assets\n- [X](nowhere.html) — Nope. X.\n```\n',
      ),
    );
    expect(problems(), isEmpty);
  });

  test('one asset may be linked from two tickets', () {
    put(
      'requirements/coach/STORY.other.MM-2.md',
      ticket(
        '## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry.html) — '
        'Proposed. The same sheet, for its unit list.\n',
      ),
    );
    expect(problems(), isEmpty);
  });

  test('two copies of one asset are reported', () {
    put('requirements/ui-ux-assets/entry-copy.html', page);
    put(
      'requirements/coach/STORY.other.MM-2.md',
      ticket(
        '## UI/UX Assets\n\n- [Entry](../ui-ux-assets/entry-copy.html) — '
        'Proposed. The same sheet again.\n',
      ),
    );
    expect(
      problems().single,
      allOf(
        contains('entry.html'),
        contains('entry-copy.html'),
        contains('Keep one copy'),
      ),
    );
  });

  test('an asset nobody could place is fine once recorded as unresolved', () {
    put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
    put(
      'requirements/ui-ux-assets/README.md',
      readme(
        unresolved:
            '- [Chooser](chooser.html): seems to be a theme chooser. '
            'Decide\n  which ticket it belongs to.',
      ),
    );
    expect(problems(), isEmpty);
  });

  test('an unresolved record must say what is to be decided', () {
    put('requirements/ui-ux-assets/chooser.html', '<p>Chooser</p>');
    put(
      'requirements/ui-ux-assets/README.md',
      readme(unresolved: '- [Chooser](chooser.html)'),
    );
    expect(problems(), contains(contains('does not say what must be decided')));
  });

  test('an unresolved record for a missing file is reported', () {
    put(
      'requirements/ui-ux-assets/README.md',
      readme(unresolved: '- [Chooser](chooser.html): a chooser. Decide.'),
    );
    expect(problems().single, contains('chooser.html is missing'));
  });

  test('an asset both linked and unresolved is reported', () {
    put(
      'requirements/ui-ux-assets/README.md',
      readme(unresolved: '- [Entry](entry.html): unsure. Decide the ticket.'),
    );
    expect(problems().single, contains('no longer unresolved'));
  });

  test('local dependencies that exist are fine', () {
    put('requirements/ui-ux-assets/entry/style.css', 'p { color: red; }');
    put('requirements/ui-ux-assets/entry/shot.png', 'png');
    put(
      'requirements/ui-ux-assets/entry.html',
      '<link rel="stylesheet" href="entry/style.css">'
          '<img src="./entry/shot.png"><a href="#top">Top</a>'
          '<a href="https://example.com">Reference</a>'
          '<style>p { background: url(entry/shot.png); }</style>'
          '<img src="data:image/png;base64,AAAA">',
    );
    expect(problems(), isEmpty);
  });

  test('a missing local dependency is reported', () {
    put(
      'requirements/ui-ux-assets/entry.html',
      '<link rel="stylesheet" href="entry/style.css"><p>Quantity</p>',
    );
    expect(
      problems().single,
      allOf(
        contains('requirements/ui-ux-assets/entry.html'),
        contains('entry/style.css, which is missing'),
      ),
    );
  });

  test('an asset that loads from the network is reported', () {
    put(
      'requirements/ui-ux-assets/entry.html',
      '<script src="https://cdn.example.com/x.js"></script>'
          "<link href='//fonts.example.com/f.css' rel='stylesheet'>",
    );
    expect(problems(), hasLength(2));
    expect(problems(), everyElement(contains('from the network')));
  });

  test('assets with no README are reported', () {
    File('${root.path}/requirements/ui-ux-assets/README.md').deleteSync();
    expect(problems().single, contains('README.md is missing'));
  });

  test('this repository follows the convention', () {
    final repository = Directory.current.path.replaceAll('\\', '/');
    final top = repository.endsWith('/tool')
        ? Directory(repository.substring(0, repository.length - 5))
        : Directory.current;
    expect(
      File('${top.path}/requirements/ui-ux-assets/README.md').existsSync(),
      isTrue,
    );
    expect(uiUxAssetProblems(top), isEmpty);
  });
}
