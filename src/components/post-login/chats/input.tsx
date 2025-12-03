import { useCallback, useState } from "react";
import { FaMicrophone } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { LuAudioLines } from "react-icons/lu";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useLivekitConnection } from "@/hooks/useLivekitConnection";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const ChatInputSection = ({
	redirectToVoiceCall,
	language,
}: {
	redirectToVoiceCall: () => void;
	language: "en" | "ar";
}) => {
	const { isConnected, sendMessage, isTranscribing, clearTranscribing } =
		useWebSocketContext();

	const {
		isRecording,
		recordingTime,
		startRecording,
		stopRecording,
		cancelRecording,
	} = useAudioRecorder();

	const [inputMessage, setInputMessage] = useState("");

	const { connect } = useLivekitConnection();

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

			// Send audio via WebSocket (without displaying message in list)
			const payload = {
				event: "AUDIO",
				data: base64Audio,
			};

			sendMessage(JSON.stringify(payload));
		} catch (error) {
			console.error("Failed to stop recording:", error);
			alert("Failed to process audio recording.");
		}
	};

	const handleCancelRecording = () => {
		cancelRecording();
	};

	const handleCancelTranscribing = () => {
		clearTranscribing();
		const payload = {
			event: "DELETEAUDIO",
			data: "",
		};
		sendMessage(JSON.stringify(payload));
	};

	const handleVoiceCall = useCallback(async () => {
		await connect(language);
		redirectToVoiceCall();
	}, [connect, language, redirectToVoiceCall]);

	const formatRecordingTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="p-6 border-t border-gray-700">
			{isTranscribing && (
				<div className="flex items-center gap-3 mb-2">
					<div className="flex items-center flex-1 gap-3 px-4 py-2 border border-blue-700 rounded bg-blue-900/30">
						<div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
						<span className="font-mono text-white">Transcribing...</span>
					</div>
					<button
						type="button"
						onClick={handleCancelTranscribing}
						className="px-4 py-2 font-medium text-white bg-gray-600 rounded hover:bg-gray-700"
						title="Cancel transcription"
					>
						Cancel
					</button>
				</div>
			)}

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
						Send
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
						className="px-4 font-medium text-white bg-[#f08010] rounded hover:bg-[#800080] disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
						title="Record audio message"
					>
						<FaMicrophone />
					</button>
					{inputMessage.length > 0 ? (
						<button
							type="button"
							onClick={handleSendMessage}
							disabled={!isConnected || !inputMessage.trim()}
							className="px-4 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
						>
							<IoIosSend size={24} />
						</button>
					) : (
						<button
							type="button"
							onClick={handleVoiceCall}
							disabled={!isConnected}
							className="px-4 font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
						>
							<LuAudioLines size={24} />
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default ChatInputSection;
