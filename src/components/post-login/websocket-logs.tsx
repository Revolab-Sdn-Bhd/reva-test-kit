import { useEffect, useRef } from "react";
import type { LogEntry } from "@/lib/useWebSocket";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

const WebsocketLogs = () => {
	const logsEndRef = useRef<HTMLDivElement>(null);

	const { logs, clearLogs } = useWebSocketContext();
	const getLogColor = (type: LogEntry["type"]) => {
		switch (type) {
			case "error":
				return "text-red-400";
			case "send":
				return "text-blue-400";
			case "receive":
				return "text-green-400";
			case "info":
				return "text-amber-400";
			default:
				return "text-gray-400";
		}
	};

	useEffect(() => {
		logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [logs]);

	return (
		<div className="flex flex-col flex-1 min-h-0 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold text-white">WebSocket Logs</h2>
				<button
					type="button"
					onClick={clearLogs}
					className="px-3 py-1 text-sm text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
				>
					Clear
				</button>
			</div>
			<div className="flex-1 p-3 space-y-1 overflow-y-auto font-mono text-sm bg-gray-900 rounded">
				{logs.length === 0 ? (
					<div className="py-4 text-center text-gray-500">
						No logs yet. Start a connection to see logs.
					</div>
				) : (
					logs.map((log) => (
						<div key={log.id} className={getLogColor(log.type)}>
							<span className="text-gray-500">[{log.timestamp}]</span>{" "}
							<span className="font-semibold">[{log.type.toUpperCase()}]</span>{" "}
							{log.message}
						</div>
					))
				)}
				<div ref={logsEndRef} />
			</div>
		</div>
	);
};

export default WebsocketLogs;
