import { useEffect } from "react";
import { Room, RoomEvent } from "livekit-client";

export function useLivekitData(room: Room | null) {
  useEffect(() => {
    if (!room) return;

    const onDataReceived = (payload: any, participant: any, kind: any, topic: any) => {
      const message = new TextDecoder().decode(payload);
      console.log("📨 Received:", {
        message,
        topic,
        from: participant.identity,
      });
    };

    room.on(RoomEvent.DataReceived, onDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
    };
  }, [room]);
}
