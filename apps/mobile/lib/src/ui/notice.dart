import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import '../theme/mm_radius.dart';
import 'notice_kind.dart';

/// An inline callout. Never a colored fill: the kind is carried by an icon, a
/// word and, for health guidance, a border.
class Notice extends StatelessWidget {
  const Notice({
    required this.text,
    this.kind = NoticeKind.info,
    this.icon,
    this.title,
    this.action,
    super.key,
  });

  final String text;
  final NoticeKind kind;

  /// Defaults to the kind's own icon.
  final IconData? icon;

  /// A bold lead sentence (for a required safeguard).
  final String? title;

  /// The thing to do about it (for a required safeguard).
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final mm = context.mm;
    final style = Theme.of(context).textTheme;
    final accent = kind == NoticeKind.info ? mm.info : mm.caution;
    final word = switch (kind) {
      NoticeKind.info => null,
      NoticeKind.caution => 'Heads up',
      NoticeKind.safeguard => 'Important',
    };
    final shownIcon =
        icon ??
        switch (kind) {
          NoticeKind.info => Icons.info_outline,
          NoticeKind.caution => Icons.warning_amber_rounded,
          NoticeKind.safeguard => Icons.shield_outlined,
        };
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: mm.surface,
        borderRadius: BorderRadius.circular(MmRadius.control),
        border: kind == NoticeKind.info
            ? null
            : Border.all(
                color: accent,
                width: kind == NoticeKind.safeguard ? 1.5 : 1,
              ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(shownIcon, size: 20, color: accent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (word != null) Text(word, style: style.labelMedium),
                if (title != null)
                  Text(
                    title!,
                    style: style.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                Text(text, style: style.bodyMedium),
                if (action != null) ...[const SizedBox(height: 8), action!],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
