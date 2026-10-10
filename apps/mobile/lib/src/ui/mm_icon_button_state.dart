import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import 'mm_icon_button.dart';
import 'mm_icon_button_kind.dart';
import 'mm_stroke_icon.dart';
import 'mm_stroke_icon_kind.dart';

class MmIconButtonState extends State<MmIconButton> {
  final _states = WidgetStatesController();

  @override
  void dispose() {
    _states.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.kind == MmIconButtonKind.standard) {
      return IconButton(
        tooltip: widget.tooltip,
        icon: Icon(widget.icon),
        onPressed: widget.onPressed,
      );
    }
    final colors = context.mm;
    return ValueListenableBuilder<Set<WidgetState>>(
      valueListenable: _states,
      builder: (context, states, _) {
        final highlighted =
            !states.contains(WidgetState.disabled) &&
            (states.contains(WidgetState.hovered) ||
                states.contains(WidgetState.focused) ||
                states.contains(WidgetState.pressed));
        return IconButton(
          tooltip: widget.tooltip,
          statesController: _states,
          mouseCursor: widget.onPressed == null
              ? SystemMouseCursors.basic
              : SystemMouseCursors.click,
          style: IconButton.styleFrom(
            minimumSize: const Size(48, 48),
            overlayColor: Colors.transparent,
          ),
          icon: AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              color: highlighted ? colors.ember : colors.addActionTint,
            ),
            child: IconTheme(
              data: IconThemeData(
                color: highlighted ? colors.onEmber : colors.ember,
              ),
              child: const MmStrokeIcon(kind: MmStrokeIconKind.plus),
            ),
          ),
          onPressed: widget.onPressed,
        );
      },
    );
  }
}
