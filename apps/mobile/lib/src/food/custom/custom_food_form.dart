import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mm_domain/mm_domain.dart';

import 'custom_food_form_state.dart';

/// Define a food once: its name, what a serving is and weighs, and its numbers
/// per serving (MM-45). Editing a saved food changes only the food, never
/// entries already logged from it.
class CustomFoodForm extends ConsumerStatefulWidget {
  const CustomFoodForm({
    required this.onDone,
    this.food,
    this.initialBarcode,
    super.key,
  });

  /// The food being edited, or null for a new one.
  final CustomFood? food;

  /// A barcode to save the food against, from a scan that found nothing.
  final String? initialBarcode;

  /// Called after saving or when the user backs out.
  final VoidCallback onDone;

  @override
  ConsumerState<CustomFoodForm> createState() => CustomFoodFormState();
}
