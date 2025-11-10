import { type Room, RoomEvent } from "livekit-client";
import { useEffect } from "react";

export function useLivekitData(room: Room | null) {
	useEffect(() => {
		if (!room) return;

		const onDataReceived = (
			payload: any,
			participant: any,
			_: any,
			topic: any,
		) => {
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
