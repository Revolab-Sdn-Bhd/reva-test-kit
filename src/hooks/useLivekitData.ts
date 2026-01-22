import { type Room, RoomEvent } from "livekit-client";
import { useEffect, useState } from "react";

enum LivekitDataTopic {
	ESCALATED = "escalated",
	NAVIGATION_CONTEXT = "navigationContext",
	SESSION = "session",
}

export function useLivekitData(room: Room | null) {
	const [sessionExpiring, setSessionExpiring] = useState(false);

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

			if (topic === LivekitDataTopic.SESSION) {
				try {
					const data = JSON.parse(message);
					// Message format: {"session_expiring": true}
					if (data.session_expiring) {
						setSessionExpiring(true);
					}
				} catch (error) {
					console.error("Failed to parse session data:", error);
				}
			}
		};

		room.on(RoomEvent.DataReceived, onDataReceived);

		return () => {
			room.off(RoomEvent.DataReceived, onDataReceived);
		};
	}, [room]);

	const sendSessionEnd = () => {
		if (!room) {
			console.warn("Cannot send session: room is null");
			return;
		}

		try {
			const message = JSON.stringify({ session_end: true });
			const data = new TextEncoder().encode(message);
			room.localParticipant.publishData(data, {
				topic: LivekitDataTopic.SESSION,
			});
			console.log("✅ Sent session event to LiveKit");
		} catch (error) {
			console.error("Failed to send session event:", error);
		}
	};

	return {
		sessionExpiring,
		clearSessionExpiring: () => setSessionExpiring(false),

		sendSessionEnd,
	};
}
