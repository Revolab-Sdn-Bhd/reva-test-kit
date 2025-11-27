import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(_: NextApiRequest, res: NextApiResponse) {
	res.json({
		LIVEKIT_URL: process.env.LIVEKIT_URL,
		AI_HANDLER_URL: process.env.AI_HANDLER_URL,
		LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
		LIVEKIT_TOKEN_ENCRYPTION_KEY: process.env.LIVEKIT_TOKEN_ENCRYPTION_KEY,
		CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL,
	});
}
