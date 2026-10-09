import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import '../format/megabytes.dart';
import '../theme/mm_colors_context.dart';
import '../ui/info_card.dart';
import '../ui/mm_button.dart';
import 'food_pack_providers.dart';

/// A pack the host offers, with what the download will and will not do, and a
/// button that starts it. Never starts by itself.
class AvailablePackCard extends ConsumerWidget {
  const AvailablePackCard({required this.listing, super.key});

  final PackListing listing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final installed = ref
        .watch(installedPacksProvider)
        .value
        ?.where((p) => p.id == listing.id)
        .firstOrNull;
    final upToDate = installed?.version == listing.version;
    final style = Theme.of(context).textTheme;
    final muted = style.bodyMedium?.copyWith(color: context.mm.text2);
    final host = listing.url.host;
    return InfoCard(
      title: listing.title,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '${megabytes(listing.downloadBytes)} to download · '
            'version ${listing.version}',
            style: style.bodyLarge,
          ),
          const SizedBox(height: 8),
          Text(
            'Foods you can find by barcode or by name. It is stored on this '
            'phone and used without a connection.',
            style: muted,
          ),
          const SizedBox(height: 8),
          Text(
            'Downloading contacts $host. That tells the host your IP address '
            'and which file you asked for, and nothing else about you. It '
            'can use a lot of mobile data, so Wi-Fi is better. You can '
            'cancel at any time.',
            style: muted,
          ),
          const SizedBox(height: 12),
          MmButton(
            label: installed == null
                ? 'Download'
                : upToDate
                ? 'Up to date'
                : 'Update',
            onPressed: upToDate
                ? null
                : () => ref
                      .read(packDownloadControllerProvider.notifier)
                      .start(listing),
          ),
        ],
      ),
    );
  }
}
