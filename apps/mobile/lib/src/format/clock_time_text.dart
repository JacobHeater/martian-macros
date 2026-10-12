import 'package:intl/intl.dart';

/// A time of day as the user reads a clock: "6:02 PM", or "6:02:10 PM" with
/// [seconds], with an ordinary space before the AM or PM.
String clockTimeText(DateTime time, {bool seconds = false}) =>
    (seconds ? DateFormat.jms('en_US') : DateFormat.jm('en_US'))
        .format(time)
        .replaceAll(' ', ' ');
