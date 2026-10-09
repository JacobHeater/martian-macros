import 'package:flutter/material.dart';

class MmStatusChip extends StatelessWidget {
  const MmStatusChip({required this.label, super.key});

  final String label;

  @override
  Widget build(BuildContext context) => Chip(label: Text(label));
}
