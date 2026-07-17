"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type TrackingSnapshotMessage = {
  updatedAt?: string;
};

export function LiveDocumentRefresh({
  initialUpdatedAt,
  shipmentId,
}: {
  initialUpdatedAt: string;
  shipmentId: string;
}) {
  const router = useRouter();
  const latestUpdateRef = useRef(initialUpdatedAt);

  useEffect(() => {
    latestUpdateRef.current = initialUpdatedAt;
  }, [initialUpdatedAt]);

  useEffect(() => {
    const source = new EventSource(`/api/shipments/${shipmentId}/tracking/stream`);

    source.addEventListener("snapshot", (event) => {
      const snapshot = JSON.parse((event as MessageEvent<string>).data) as TrackingSnapshotMessage;

      if (snapshot.updatedAt && snapshot.updatedAt !== latestUpdateRef.current) {
        latestUpdateRef.current = snapshot.updatedAt;
        router.refresh();
      }
    });

    return () => source.close();
  }, [router, shipmentId]);

  return null;
}
