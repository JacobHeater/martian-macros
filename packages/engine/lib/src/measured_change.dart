/// Which way a measurement went over a period, judged against its own
/// noise (MM-133, MM-155). No clear change is a result, not an absence.
enum MeasuredChange { down, up, noClearChange }
