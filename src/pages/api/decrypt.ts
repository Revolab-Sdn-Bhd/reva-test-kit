import crypto from "node:crypto";
import type { NextApiRequest, NextApiResponse } from "next";

// ---- crypto utils ----
function deriveKey(rotatingId: string, salt: string): Buffer {
	const passwordBytes = Buffer.from(rotatingId, "utf-8");
	const saltBytes = Buffer.from(salt, "utf-8");

	return crypto.scryptSync(passwordBytes, saltBytes, 32, {
		N: 2 ** 14,
		r: 8,
		p: 1,
	});
}

function decryptToken(
	derivedKey: Buffer,
	nonce: Buffer,
	encryptedToken: Buffer,
): string {
	const authTag = encryptedToken.slice(encryptedToken.length - 16);
	const ciphertext = encryptedToken.slice(0, encryptedToken.length - 16);

	const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, nonce);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([
		decipher.update(ciphertext),
		decipher.final(),
	]);

	return decrypted.toString("utf-8");
}

// ---- API Route ----
export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { rotatingId, salt, nonceB64, encryptedTokenB64 } = req.body;

		if (!rotatingId || !salt || !nonceB64 || !encryptedTokenB64) {
			return res.status(400).json({ error: "Missing required fields" });
		}

		const nonce = Buffer.from(nonceB64, "base64");
		const encryptedToken = Buffer.from(encryptedTokenB64, "base64");

		const derivedKey = deriveKey(rotatingId, salt);
		const decrypted = decryptToken(derivedKey, nonce, encryptedToken);

		return res.status(200).json({ decrypted });
	} catch (err: any) {
		console.error("Decrypt API error:", err);
		return res.status(500).json({
			error: err.message || "Failed to decrypt",
		});
	}
}
