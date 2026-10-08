import 'package:flutter/material.dart';

/// The top bar of a screen.
class MmAppBar extends StatelessWidget implements PreferredSizeWidget {
  const MmAppBar({required this.title, this.actions = const [], super.key});

  final String title;
  final List<Widget> actions;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) =>
      AppBar(title: Text(title), actions: actions);
}
