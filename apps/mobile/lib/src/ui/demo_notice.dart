import 'package:flutter/material.dart';

/// Always identifies synthetic data, including outside the home screen.
class DemoNotice extends StatelessWidget {
  const DemoNotice({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      SafeArea(
        bottom: false,
        child: Text(
          'DEMO · Synthetic data',
          style: Theme.of(context).textTheme.labelMedium,
        ),
      ),
      Expanded(child: child),
    ],
  );
}
