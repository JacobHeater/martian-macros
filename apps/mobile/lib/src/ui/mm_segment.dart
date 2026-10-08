import 'package:flutter/material.dart';

/// One option of an [MmSegmented] control.
final class MmSegment<T> {
  const MmSegment(this.value, this.label, {this.icon});

  final T value;
  final String label;
  final IconData? icon;
}
