import { useState } from "react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const ChatInputSection = () => {
	const { isConnected, sendMessage } = useWebSocketContext();

	const {
		isRecording,
		recordingTime,
		startRecording,
		stopRecording,
		cancelRecording,
	} = useAudioRecorder();

	const [inputMessage, setInputMessage] = useState("");

	const handleSendMessage = () => {
		if (!inputMessage.trim()) return;

		const payload = {
			event: "MESSAGE",
			data: inputMessage,
		};

		if (sendMessage(JSON.stringify(payload), inputMessage)) {
			setInputMessage("");
		}
	};

	const handleStartRecording = async () => {
		try {
			await startRecording();
		} catch (error) {
			console.error("Failed to start recording:", error);
			alert("Failed to access microphone. Please check your permissions.");
		}
	};

	const handleStopRecording = async () => {
		try {
			const base64Audio = await stopRecording();

			// Send audio via WebSocket
			const payload = {
				event: "AUDIO",
				data: base64Audio,
			};

			sendMessage(JSON.stringify(payload), "🎤 Audio message");
		} catch (error) {
			console.error("Failed to stop recording:", error);
			alert("Failed to process audio recording.");
		}
	};

	const handleCancelRecording = () => {
		cancelRecording();
	};

	const formatRecordingTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="p-6 border-t border-gray-700">
			{isRecording ? (
				<div className="flex items-center gap-3">
					<div className="flex items-center flex-1 gap-3 px-4 py-3 border border-red-700 rounded bg-red-900/30">
						<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
						<span className="font-mono text-white">
							Recording: {formatRecordingTime(recordingTime)}
						</span>
					</div>
					<button
						type="button"
						onClick={handleCancelRecording}
						className="px-4 py-2 font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
						title="Cancel recording"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleStopRecording}
						className="px-4 py-2 font-medium text-white bg-red-600 rounded hover:bg-red-700"
						title="Stop and send recording"
					>
						Stop & Send
					</button>
				</div>
			) : (
				<div className="flex gap-2">
					<input
						type="text"
						value={inputMessage}
						onChange={(e) => setInputMessage(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSendMessage();
							}
						}}
						disabled={!isConnected}
						className="flex-1 px-4 py-2 text-white placeholder-gray-400 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-900"
						placeholder={
							isConnected ? "Type a message..." : "Connect to start chatting"
						}
					/>
					<button
						type="button"
						onClick={handleStartRecording}
						disabled={!isConnected}
						className="px-4 py-2 font-medium text-white bg-purple-600 rounded hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
						title="Record audio message"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="w-5 h-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fillRule="evenodd"
								d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
								clipRule="evenodd"
							/>
						</svg>
					</button>
					<button
						type="button"
						onClick={handleSendMessage}
						disabled={!isConnected || !inputMessage.trim()}
						className="px-6 py-2 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
					>
						Send
					</button>
				</div>
			)}
		</div>
	);
};

export default ChatInputSection;
