import type { NextApiRequest, NextApiResponse } from "next";
import { enableCliQ, getCliqEnableStatus } from "@/lib/cache";

interface EnableCliqResponse {
	data: {
		results: number | undefined;
	};
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		EnableCliqResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "POST") {
		try {
			const { enable } = req.query;

			if (!enable) {
				return res.status(400).json({
					error: "query enable is required",
				});
			}

			const enableValue = parseInt(enable as string, 10);

			if (enableValue !== 0 && enableValue !== 1) {
				return res.status(400).json({
					error: "enable must be 0 or 1",
				});
			}

			enableCliQ(enableValue);

			return res.status(200).end();
		} catch (error) {
			console.error("Error update cliq status:", error);
			return res.status(500).json({ error: "Internal server error " });
		}
	}

	if (req.method === "GET") {
		try {
			const cliqStatus = getCliqEnableStatus();

			const response: EnableCliqResponse = {
				data: {
					results: cliqStatus?.cliqEnable,
				},
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error retrieve cliq status", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
