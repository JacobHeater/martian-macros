import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_button.dart';
import 'mm_button_kind.dart';
import 'mm_progress_bar.dart';

/// A thin bar that says a download is happening, how far along it is, and
/// lets the user stop it, on every screen while it runs.
class DownloadStatusStrip extends StatelessWidget {
  const DownloadStatusStrip({
    required this.label,
    required this.fraction,
    required this.onCancel,
    super.key,
  });

  final String label;

  /// 0 to 1.
  final double fraction;

  /// Null while the download is past the point where it can be stopped.
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    label: '$label, ${(fraction * 100).round()} percent',
    child: Material(
      color: context.mm.raised,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(label, style: Theme.of(context).textTheme.labelLarge),
                    const SizedBox(height: 6),
                    MmProgressBar(value: fraction, height: 4),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              MmButton(
                label: 'Cancel',
                kind: MmButtonKind.text,
                onPressed: onCancel,
              ),
            ],
          ),
        ),
      ),
    ),
  );
}
