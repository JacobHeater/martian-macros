import 'package:intl/intl.dart';

/// A time of day as the user reads a clock: "6:02 PM", with an ordinary
/// space before the AM or PM.
String clockTimeText(DateTime time) =>
    DateFormat.jm('en_US').format(time).replaceAll(' ', ' ');
