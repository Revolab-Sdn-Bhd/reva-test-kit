import type { FC } from "react";
import { useState } from "react";
import JsonEditor from "@/components/JsonEditor";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

interface CustomPayloadTabProps {
	isConnected: boolean;
}

const initialCustomJson = `{
  "event": "MESSAGE",
  "data": "Hello"
}`;

const CustomPayloadTab: FC<CustomPayloadTabProps> = ({ isConnected }) => {
	const [customJson, setCustomJson] = useState(initialCustomJson);
	const [jsonError, setJsonError] = useState("");

	const { sendMessage } = useWebSocketContext();

	const handleSendCustomJson = () => {
		try {
			const parsed = JSON.parse(customJson);
			setJsonError("");

			// Extract display message for chat window
			let displayMessage = "";
			if (typeof parsed.data === "string") {
				displayMessage = parsed.data;
			} else if (parsed.data?.message) {
				displayMessage = parsed.data.message;
			} else {
				displayMessage = `Sent ${parsed.event || "custom"} event`;
			}

			if (sendMessage(customJson, displayMessage)) {
				setCustomJson(initialCustomJson);
			}
		} catch (error) {
			setJsonError(
				`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	};

	return (
		<div className="space-y-4">
			<div className="w-full">
				<JsonEditor
					value={customJson}
					onChange={(newValue) => {
						if (newValue === undefined) return;
						setCustomJson(newValue);
						setJsonError("");
					}}
					readOnly={!isConnected}
				/>
				{jsonError && <p className="mt-1 text-xs text-red-400">{jsonError}</p>}
			</div>

			<div className="flex gap-2">
				<button
					type="button"
					onClick={handleSendCustomJson}
					disabled={!isConnected || !customJson.trim()}
					className="flex-1 px-4 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
				>
					Send Custom JSON
				</button>
			</div>
		</div>
	);
};

export default CustomPayloadTab;
