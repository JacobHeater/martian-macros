/// Where an intake sits against its target (MM-123, MM-149). Distance is
/// symmetric: under and over are described in the same grammar. Below the
/// calorie floor is its own case and is never "on target".
enum IntakeStanding { belowFloor, below, onTarget, above }
