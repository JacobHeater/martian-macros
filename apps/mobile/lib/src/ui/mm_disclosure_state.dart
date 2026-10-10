import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_disclosure.dart';
import 'mm_stroke_icon.dart';
import 'mm_stroke_icon_kind.dart';

class MmDisclosureState extends State<MmDisclosure> {
  late bool _expanded;
  bool _hovered = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final stored = PageStorage.maybeOf(context)?.readState(context);
    _expanded = stored is bool ? stored : widget.initiallyExpanded;
  }

  @override
  Widget build(BuildContext context) => ListTileTheme(
    horizontalTitleGap: widget.header == null ? null : 12,
    child: ExpansionTile(
      tilePadding: widget.header == null
          ? EdgeInsets.zero
          : const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      childrenPadding: EdgeInsets.zero,
      shape: const Border(),
      collapsedShape: const Border(),
      title: widget.header ?? Text(widget.title),
      subtitle: widget.subtitle == null ? null : Text(widget.subtitle!),
      initiallyExpanded: widget.initiallyExpanded,
      maintainState: widget.maintainState,
      onExpansionChanged: (expanded) => setState(() => _expanded = expanded),
      trailing: widget.header == null
          ? null
          : MouseRegion(
              onEnter: (_) => setState(() => _hovered = true),
              onExit: (_) => setState(() => _hovered = false),
              child: IconTheme(
                data: IconThemeData(
                  color: _hovered ? context.mm.text2 : context.mm.text3,
                ),
                child: AnimatedRotation(
                  turns: _expanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: const MmStrokeIcon(kind: MmStrokeIconKind.chevron),
                ),
              ),
            ),
      children: widget.children,
    ),
  );
}
