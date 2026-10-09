import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_pack_providers.dart';
import 'package:martian_macros/src/food_packs/pack_download_state.dart';
import 'package:martian_macros/src/food_packs/pack_download_status.dart';
import 'package:martian_macros/src/ui/mm_button.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/fake_pack_download_controller.dart';
import 'support/pump_app.dart';

/// MM-56: the food database screen and the download strip. The network is a
/// fake and the download itself is a stand-in, so only what the user sees and
/// can tap is under test here (the download is tested in the food_catalog
/// package and the controller test).
void main() {
  final today = CalendarDate(2026, 10, 9);
  final manifestUrl = Uri.parse('https://packs.example.test/manifest.json');
  final listing = PackListing(
    id: 'barcode_us',
    title: 'Barcode foods, United States',
    version: '2026-10-09',
    formatVersion: 1,
    url: Uri.parse('https://packs.example.test/barcode_us.pack.gz'),
    downloadBytes: 46000000,
    sha256: 'c' * 64,
  );
  late InMemoryRepositories repos;
  late InMemoryPackHttp http;

  setUp(() {
    repos = InMemoryRepositories();
    http = InMemoryPackHttp({
      manifestUrl:
          ('{"packs":[{"id":"barcode_us","title":"Barcode foods, United '
                  'States","version":"2026-10-09","formatVersion":1,'
                  '"url":"https://packs.example.test/barcode_us.pack.gz",'
                  '"bytes":46739747,"sha256":"${'b' * 64}"}]}')
              .codeUnits,
    });
  });

  Future<FakePackDownloadController> openScreen(
    WidgetTester tester, {
    PackDownloadState state = const PackDownloadState(),
    String url = '',
  }) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-60)));
    final fake = FakePackDownloadController(state);
    final overrides = <Override>[
      packHttpProvider.overrideWithValue(http),
      packManifestUrlProvider.overrideWithValue(url),
      installedPacksProvider.overrideWith((ref) async => const []),
      packDownloadControllerProvider.overrideWith(() => fake),
    ];
    await pumpApp(tester, repos, FixedClock(today), overrides: overrides);
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Food database'), 300);
    await tester.tap(find.text('Food database'));
    await tester.pumpAndSettle();
    return fake;
  }

  testWidgets('a build with no download address says so and fetches nothing', (
    tester,
  ) async {
    await openScreen(tester);
    expect(find.textContaining('not set up in this version'), findsOneWidget);
    expect(find.text('See what is available'), findsNothing);
    expect(http.requests, isEmpty);
  });

  testWidgets('the sources are credited on the screen', (tester) async {
    await openScreen(tester);
    await tester.scrollUntilVisible(
      find.textContaining('Open Food Facts'),
      200,
    );
    expect(find.textContaining('Open Database License'), findsOneWidget);
    expect(find.textContaining('USDA FoodData Central'), findsOneWidget);
  });

  testWidgets(
    'opening the screen fetches nothing; the list is read when asked, '
    'and the download waits for its own button',
    (tester) async {
      final fake = await openScreen(tester, url: manifestUrl.toString());
      expect(http.requests, isEmpty, reason: 'opening is not a request');
      expect(find.textContaining('packs.example.test once'), findsOneWidget);
      expect(
        find.textContaining('IP address and nothing else'),
        findsOneWidget,
      );

      await tester.tap(find.text('See what is available'));
      await tester.pumpAndSettle();
      expect(http.requests.single.url, manifestUrl);
      expect(find.text('Barcode foods, United States'), findsOneWidget);
      expect(find.textContaining('47 MB to download'), findsOneWidget);
      expect(
        find.textContaining('tells the host your IP address'),
        findsOneWidget,
      );
      expect(find.textContaining('cancel at any time'), findsOneWidget);
      expect(fake.started, isEmpty, reason: 'nothing starts by itself');

      final button = find.widgetWithText(MmButton, 'Download');
      await tester.ensureVisible(button);
      await tester.tap(button);
      await tester.pump();
      expect(fake.started.single.id, 'barcode_us');
    },
  );

  testWidgets('an unreachable host is reported and says nothing changed', (
    tester,
  ) async {
    http.files.remove(manifestUrl);
    await openScreen(tester, url: manifestUrl.toString());
    await tester.tap(find.text('See what is available'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Nothing was changed'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets(
    'a running download shows how far along it is, and Cancel works',
    (tester) async {
      final fake = await openScreen(
        tester,
        url: manifestUrl.toString(),
        state: PackDownloadState(
          status: PackDownloadStatus.running,
          listing: listing,
          progress: const PackDownloadProgress(
            phase: PackDownloadPhase.downloading,
            receivedBytes: 12000000,
            totalBytes: 46000000,
          ),
        ),
      );
      expect(find.text('Downloading'), findsWidgets);
      expect(find.text('12 MB of 46 MB'), findsOneWidget);

      await tester.tap(find.text('Cancel').last);
      await tester.pump();
      expect(fake.cancelled, 1);
    },
  );

  testWidgets('a paused download can be resumed or discarded', (tester) async {
    final fake = await openScreen(
      tester,
      url: manifestUrl.toString(),
      state: PackDownloadState(
        status: PackDownloadStatus.paused,
        listing: listing,
        keptBytes: 20000000,
      ),
    );
    expect(find.text('Paused'), findsOneWidget);
    expect(find.textContaining('20 MB of 46 MB is kept'), findsOneWidget);
    await tester.tap(find.text('Resume'));
    await tester.pump();
    expect(fake.started, [listing]);
    await tester.tap(find.text('Discard'));
    await tester.pump();
    expect(fake.discarded, 1);
  });

  testWidgets('a failure says what happened to the old pack', (tester) async {
    await openScreen(
      tester,
      url: manifestUrl.toString(),
      state: PackDownloadState(
        status: PackDownloadStatus.failed,
        listing: listing,
        problem: PackDownloadProblem.checksumMismatch,
      ),
    );
    expect(find.textContaining('thrown away'), findsOneWidget);
    expect(
      find.textContaining('Nothing on your phone changed'),
      findsOneWidget,
    );
    expect(find.text('Try again'), findsOneWidget);
  });

  testWidgets('while a download runs, every screen shows a strip with Cancel', (
    tester,
  ) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-60)));
    final fake = FakePackDownloadController(
      PackDownloadState(
        status: PackDownloadStatus.running,
        listing: listing,
        progress: const PackDownloadProgress(
          phase: PackDownloadPhase.downloading,
          receivedBytes: 23000000,
          totalBytes: 46000000,
        ),
      ),
    );
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: [packDownloadControllerProvider.overrideWith(() => fake)],
    );
    // The Dashboard, with the download going on underneath it.
    expect(
      find.text('Downloading Barcode foods, United States'),
      findsOneWidget,
    );
    expect(find.bySemanticsLabel(RegExp('50 percent')), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pump();
    expect(fake.cancelled, 1);

    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    expect(
      find.text('Downloading Barcode foods, United States'),
      findsOneWidget,
      reason: 'the strip stays on the next screen',
    );
  });

  testWidgets('no strip when nothing is downloading', (tester) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-60)));
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: [
        packDownloadControllerProvider.overrideWith(
          () => FakePackDownloadController(const PackDownloadState()),
        ),
      ],
    );
    expect(find.textContaining('Downloading'), findsNothing);
  });
}
