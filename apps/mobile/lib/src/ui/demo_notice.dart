import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';

/// Always identifies synthetic data, including outside the home screen.
class DemoNotice extends StatelessWidget {
  const DemoNotice({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
    children: [
      ColoredBox(
        color: context.mm.canvas,
        child: SizedBox(
          width: double.infinity,
          child: SafeArea(
            bottom: false,
            child: Text(
              'DEMO · Synthetic data',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelMedium!
                  .copyWith(color: context.mm.text),
            ),
          ),
        ),
      ),
      Expanded(child: child),
    ],
  );
}
