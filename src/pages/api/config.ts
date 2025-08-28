import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({
    LIVEKIT_URL: process.env.LIVEKIT_URL,
    AI_HANDLER_URL: process.env.AI_HANDLER_URL,
    LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  });
}
