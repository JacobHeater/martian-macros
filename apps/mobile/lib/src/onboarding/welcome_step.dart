import 'package:flutter/material.dart';

import '../theme/mm_colors_context.dart';
import '../ui/horizon_arc.dart';
import '../ui/mm_button.dart';

/// The first screen: what the app is, the horizon arc drawn once, and a way in.
class WelcomeStep extends StatelessWidget {
  const WelcomeStep({required this.onStart, super.key});

  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Spacer(flex: 2),
          Text('Martian Macros', style: text.displaySmall),
          const SizedBox(height: 12),
          Text(
            'Coaching for fat loss and muscle gain that adapts to your body, '
            'not a formula.',
            style: text.bodyLarge?.copyWith(color: context.mm.text2),
          ),
          const SizedBox(height: 32),
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 0.62),
            duration: const Duration(milliseconds: 600),
            curve: Curves.easeOutCubic,
            builder: (context, progress, _) => HorizonArc(
              progress: progress,
              semanticsLabel: 'A body travelling along a horizon',
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'A few questions first. It takes about two minutes, and everything '
            'stays on this phone.',
            style: text.bodyMedium?.copyWith(color: context.mm.text2),
          ),
          const Spacer(flex: 3),
          Align(
            alignment: Alignment.centerRight,
            child: MmButton(label: 'Get started', onPressed: onStart),
          ),
        ],
      ),
    );
  }
}
