import 'package:flutter/material.dart';

import 'mm_disclosure_state.dart';

/// A heading that opens more detail underneath: the "one tap down" layer.
class MmDisclosure extends StatefulWidget {
  const MmDisclosure({
    required this.title,
    required this.children,
    this.subtitle,
    this.header,
    this.initiallyExpanded = false,
    this.maintainState = false,
    super.key,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final Widget? header;
  final bool initiallyExpanded;
  final bool maintainState;

  @override
  State<MmDisclosure> createState() => MmDisclosureState();
}
