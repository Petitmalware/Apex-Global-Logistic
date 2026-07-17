# Live tracking operations

## Manual shipment checkpoints

1. Sign in as an admin and open **Shipments**.
2. Open the shipment and find **Publish tracking update**.
3. Choose a common action or select the customer-visible status and timeline event.
4. Enter the actual checkpoint time, current city/facility, and a clear customer note.
5. Optionally paste a verified latitude and longitude from a map pin.
6. Publish the update. The public tracking page, authenticated timeline, receipt, and attached invoice refresh from the same tracking record.

Use **Put on hold** to pause movement without cancelling the shipment. State the factual reason and next action. Use **Resume transit** when movement starts again.

## Map behavior

- A named location is enough for manual milestone tracking.
- The map appears only after a valid latitude and longitude are recorded.
- The public page labels the marker as the latest reported position, not continuous GPS.
- Redis carries the event to connected browser sessions and Server-Sent Events deliver the new snapshot.

## Continuous GPS integration

Continuous vehicle movement requires a trusted coordinate source such as a driver mobile app, fleet telematics provider, or carrier tracking API. That source should authenticate to a dedicated ingestion endpoint, sign each request, include the shipment or vehicle identifier and timestamp, and be rate-limited. Do not manufacture coordinates or label manual checkpoints as live GPS.
