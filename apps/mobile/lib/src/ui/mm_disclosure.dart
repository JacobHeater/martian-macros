import 'package:flutter/material.dart';

/// A heading that opens more detail underneath: the "one tap down" layer.
class MmDisclosure extends StatelessWidget {
  const MmDisclosure({
    required this.title,
    required this.children,
    this.subtitle,
    super.key,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => ExpansionTile(
    tilePadding: EdgeInsets.zero,
    childrenPadding: EdgeInsets.zero,
    shape: const Border(),
    collapsedShape: const Border(),
    title: Text(title),
    subtitle: subtitle == null ? null : Text(subtitle!),
    children: children,
  );
}
