import 'package:flutter/material.dart';

/// Each text role, set in the current theme.
class TypeSpecimens extends StatelessWidget {
  const TypeSpecimens({super.key});

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final roles = <String, TextStyle?>{
      'Figure (displaySmall)': t.displaySmall,
      'Headline (headlineMedium)': t.headlineMedium,
      'Title (titleLarge)': t.titleLarge,
      'Heading (titleMedium)': t.titleMedium,
      'Body (bodyMedium)': t.bodyMedium,
      'Label (labelMedium)': t.labelMedium,
      'Caption (bodySmall)': t.bodySmall,
    };
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final MapEntry(:key, :value) in roles.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(key, style: value),
          ),
        Text('1,234 kcal  172 g  −0.8 lb', style: t.titleLarge),
      ],
    );
  }
}
