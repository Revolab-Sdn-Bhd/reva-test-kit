import { type Room, RoomEvent } from "livekit-client";
import { useEffect, useState } from "react";

enum LivekitDataTopic {
  ESCALATED = "escalated",
  NAVIGATION_CONTEXT = "navigationContext",
  SESSION = "session",
}

interface EscalationData {
  waLink: string;
  chatId: string;
}

export function useLivekitData(room: Room | null) {
  const [escalationData, setEscalationData] = useState<EscalationData | null>(
    null
  );
  const [sessionExpiring, setSessionExpiring] = useState(false);

  useEffect(() => {
    if (!room) return;

    // Example message format:
    // 	{
    // 	"message": "{\"escalated_voice\": {\"escalated\": true, \"wa_link\": \"https://wa.me/962792777027\", \"chat_id\": \"06912df4-eaa8-75fe-8000-d2fab871ad6c\"}}",
    // 	"topic": "escalated",
    // 	"from": "agent-AJ_5sLTHMRiwWbD"
    // }

    const onDataReceived = (
      payload: any,
      participant: any,
      _: any,
      topic: any
    ) => {
      const message = new TextDecoder().decode(payload);
      console.log("📨 Received:", {
        message,
        topic,
        from: participant.identity,
      });

      if (topic === LivekitDataTopic.ESCALATED) {
        try {
          const data = JSON.parse(message);
          // Message format: {"escalated_voice": {"escalated": true, "wa_link": "...", "chat_id": "..."}}
          if (data.escalated_voice) {
            const { wa_link, chat_id } = data.escalated_voice;
            if (wa_link) {
              setEscalationData({
                waLink: wa_link,
                chatId: chat_id,
              });
            }
          }
        } catch (error) {
          console.error("Failed to parse escalation data:", error);
        }
      }

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
    escalationData,
    clearEscalation: () => setEscalationData(null),

    sessionExpiring,
    clearSessionExpiring: () => setSessionExpiring(false),

    sendSessionEnd,
  };
}
