import type { NextApiRequest, NextApiResponse } from "next";
import { getUserWithCliq } from "@/lib/cache";

interface CliQProfile {
	profileStatus: string;
	alias: {
		status: string;
		type: string;
		value: string;
	};
	account: {
		status: string;
		iban: string;
		isDefault: string;
	};
}

interface RetrieveCliQProfileResponse {
	metadata: {
		queryParameters: Record<string, any>;
	};
	links: Array<{
		href: string;
		method: string;
		rel: string;
	}>;
	data: CliQProfile;
}

export default function handler(
	req: NextApiRequest,
	res: NextApiResponse<
		RetrieveCliQProfileResponse | { error: string; message?: string }
	>,
) {
	if (req.method === "GET") {
		try {
			//assuming only have single profile
			const profiles = getUserWithCliq();

			if (profiles === null) {
				return res.status(400).json({
					error: "CliQ profile not found",
				});
			}

			const result: CliQProfile = {
				profileStatus: "Active",
				alias: {
					status: "Active",
					type: "ALIAS",
					value: "MAINUSER",
				},
				account: {
					status: "Active",
					iban: profiles.virtualIban,
					isDefault: "false",
				},
			};

			const response: RetrieveCliQProfileResponse = {
				metadata: { queryParameters: {} },
				links: [
					{
						href: "/neobanking/revolab/cliq/profile/v1/cliq-profile",
						method: "GET",
						rel: "self",
					},
				],
				data: result,
			};

			return res.status(200).json(response);
		} catch (error) {
			console.error("Error retrieve cliq profile:", error);
			return res.status(500).json({ error: "Internal server error" });
		}
	}

	return res.status(405).json({ error: "Method not allowed" });
}
