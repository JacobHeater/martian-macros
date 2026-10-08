import 'package:flutter/material.dart';

/// The top bar of a screen.
class MmAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MmAppBar({
    this.title,
    this.titleWidget,
    this.actions = const [],
    super.key,
  });

  final String? title;

  /// Replaces [title] (the Food screen puts its day stepper here).
  final Widget? titleWidget;
  final List<Widget> actions;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) => AppBar(
    title: titleWidget ?? (title == null ? null : Text(title!)),
    actions: actions,
  );
}
