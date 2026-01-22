import { useDataChannel } from "@livekit/components-react";
import { useState } from "react";
import z from "zod";

const CHANNEL = "escalated";

const msgSchema = z.object({
	escalated_voice: z.object({
		escalated: z.boolean(),
		wa_link: z.string().optional(),
		chat_id: z.string().optional(),
		session_id: z.string().optional(),
	}),
});

interface EscalationData {
	chatId: string | null;
	sessionId: string | null;
	wsLink: string | null;
}

interface ChannelConfig {
	onEscalated?: (data: EscalationData) => void;
}

export function useEscalatedChannel(config: ChannelConfig = {}) {
	const [data, setData] = useState<EscalationData>({
		chatId: null,
		sessionId: null,
		wsLink: null,
	});

	useDataChannel(CHANNEL, (msg) => {
		const decoded = JSON.parse(new TextDecoder("utf-8").decode(msg.payload));

		console.log("📨 Received:", {
			message: decoded,
			topic: msg.topic,
			from: msg.from?.identity,
		});

		const parsed = msgSchema.safeParse(decoded);
		if (!parsed.success) {
			console.error("Failed to parse escalated message:", parsed.error);
			return;
		}

		const data = parsed.data.escalated_voice;

		const newData: EscalationData = {
			chatId: data.chat_id ?? null,
			sessionId: data.session_id ?? null,
			wsLink: data.wa_link ?? null,
		};

		setData(newData);
		config.onEscalated?.(newData);
	});

	return data;
}
