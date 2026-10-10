import 'package:flutter/material.dart';

import 'mm_icon_button_kind.dart';
import 'mm_icon_button_state.dart';

/// An icon-only button. The tooltip is required: it is the accessible name.
class MmIconButton extends StatefulWidget {
  const MmIconButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.kind = MmIconButtonKind.standard,
    super.key,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;
  final MmIconButtonKind kind;

  @override
  State<MmIconButton> createState() => MmIconButtonState();
}
