import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/megabytes.dart';
import '../theme/mm_colors_context.dart';
import '../ui/group_header.dart';
import '../ui/mm_app_bar.dart';
import '../ui/mm_button.dart';
import '../ui/mm_button_kind.dart';
import '../ui/mm_list_group.dart';
import '../ui/mm_list_row.dart';
import '../ui/mm_spinner.dart';
import '../ui/notice.dart';
import '../ui/notice_kind.dart';
import '../ui/show_mm_confirm.dart';
import 'available_pack_card.dart';
import 'food_pack_providers.dart';
import 'pack_download_card.dart';
import 'pack_download_status.dart';

/// What food data is on this phone, and the only place a download starts
/// (MM-56). Nothing is fetched until the user taps a button here.
class FoodDatabaseScreen extends ConsumerWidget {
  const FoodDatabaseScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final url = ref.watch(packManifestUrlProvider);
    final manifest = ref.watch(packManifestProvider);
    final installed = ref.watch(installedPacksProvider).value ?? const [];
    final download = ref.watch(packDownloadControllerProvider);
    final muted = Theme.of(context).textTheme.bodyMedium
        ?.copyWith(color: context.mm.text2);
    final titles = <String, String>{
      for (final p in manifest.manifest?.packs ?? const <PackListing>[])
        p.id: p.title,
      if (download.listing case final listing?) listing.id: listing.title,
    };

    return Scaffold(
      appBar: const MmAppBar(title: 'Food database'),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: Text(
              'Barcode scanning needs a database of foods. It is a separate '
              'download, and nothing is downloaded unless you choose to.',
              style: muted,
            ),
          ),
          const GroupHeader('On this phone'),
          MmListGroup(
            children: [
              if (installed.isEmpty)
                const MmListRow(title: 'Nothing downloaded yet')
              else
                for (final pack in installed)
                  MmListRow(
                    title: titles[pack.id] ?? pack.id,
                    subtitle:
                        'Version ${pack.version} · ${megabytes(pack.bytes)}',
                    trailing: MmButton(
                      label: 'Remove',
                      kind: MmButtonKind.text,
                      onPressed: () async {
                        final store = await ref.read(packStoreProvider.future);
                        if (!context.mounted) return;
                        final confirmed = await showMmConfirm(
                          context,
                          title: 'Remove this food database?',
                          message:
                              'It frees ${megabytes(pack.bytes)}. Foods you '
                              'have already logged keep their numbers. You '
                              'can download it again later.',
                          confirmLabel: 'Remove',
                        );
                        if (!confirmed) return;
                        store.remove(pack.id);
                        ref.invalidate(installedPacksProvider);
                      },
                    ),
                  ),
            ],
          ),
          const GroupHeader('Download'),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: PackDownloadCard(),
          ),
          if (url.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Notice(
                text:
                    'Food downloads are not set up in this version of the '
                    'app, so nothing can be fetched.',
              ),
            )
          else if (manifest.checking)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  MmSpinner(),
                  SizedBox(width: 12),
                  Text('Checking what is available…'),
                ],
              ),
            )
          else if (manifest.manifest case final available?)
            for (final listing in available.packs)
              if (download.listing?.id != listing.id ||
                  download.status == PackDownloadStatus.idle ||
                  download.status == PackDownloadStatus.done)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: AvailablePackCard(listing: listing),
                )
              else
                const SizedBox.shrink()
          else ...[
            if (manifest.message != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Notice(
                  kind: NoticeKind.caution,
                  text: '${manifest.message} Nothing was changed.',
                ),
              ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MmButton(
                    label: manifest.message == null
                        ? 'See what is available'
                        : 'Try again',
                    kind: MmButtonKind.secondary,
                    onPressed: () =>
                        ref.read(packManifestProvider.notifier).check(),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This contacts ${Uri.parse(url).host} once to read a '
                    'small list. It reveals your IP address and nothing else.',
                    style: muted,
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
