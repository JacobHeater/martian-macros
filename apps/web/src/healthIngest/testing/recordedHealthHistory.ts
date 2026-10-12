/**
 * A recorded history for `FakeHealthSource` (MM-67), in the order things
 * happened on the platform. It holds what makes importing hard: two
 * sources that weighed the same morning, a gap of days, a reading edited
 * afterwards, and one deleted.
 *
 * Every reading in it is made up.
 */
export const recordedHealthHistory = `
{
  "sources": [
    {"id": "com.example.scale", "name": "Bathroom scale"},
    {"id": "com.example.watch", "name": "Watch"},
    {"id": "com.example.manual", "name": "Health app, typed"}
  ],
  "events": [
    {"op": "add", "type": "weight", "id": "w-1", "value": 82.6, "start": "2026-09-01T07:02:00", "source": "com.example.scale"},
    {"op": "add", "type": "bodyFat", "id": "f-1", "value": 21.4, "start": "2026-09-01T07:02:00", "source": "com.example.scale"},
    {"op": "add", "type": "weight", "id": "w-2", "value": 82.3, "start": "2026-09-02T07:05:00", "source": "com.example.scale"},
    {"op": "add", "type": "weight", "id": "w-3", "value": 83.0, "start": "2026-09-02T07:40:00", "source": "com.example.manual"},
    {"op": "add", "type": "steps", "id": "s-1", "value": 8421, "start": "2026-09-02T00:00:00", "end": "2026-09-03T00:00:00", "source": "com.example.watch"},
    {"op": "add", "type": "workout", "id": "x-1", "value": 55, "start": "2026-09-02T18:00:00", "end": "2026-09-02T18:55:00", "source": "com.example.watch"},
    {"op": "add", "type": "weight", "id": "w-4", "value": 82.1, "start": "2026-09-03T06:58:00", "source": "com.example.scale"},
    {"op": "add", "type": "weight", "id": "w-5", "value": 81.9, "start": "2026-09-08T07:10:00", "source": "com.example.scale"},
    {"op": "add", "type": "height", "id": "h-1", "value": 178, "start": "2026-09-08T07:12:00", "source": "com.example.manual"},
    {"op": "edit", "type": "weight", "id": "w-3", "value": 82.4, "start": "2026-09-02T07:40:00", "source": "com.example.manual"},
    {"op": "delete", "type": "weight", "id": "w-2"},
    {"op": "add", "type": "weight", "id": "w-6", "value": 81.7, "start": "2026-09-09T07:03:00", "source": "com.example.scale"}
  ]
}
`;
