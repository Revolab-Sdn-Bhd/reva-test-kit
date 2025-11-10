import type { ChatMessage as ComponentsChatMessage } from "@livekit/components-react";
import { useEffect, useRef } from "react";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatMessageInput } from "@/components/chat/ChatMessageInput";

const inputHeight = 48;

export type ChatMessageType = {
	name: string;
	message: string;
	isSelf: boolean;
	timestamp: number;
};

type ChatTileProps = {
	messages: ChatMessageType[];
	accentColor: string;
	onSend?: (message: string) => Promise<ComponentsChatMessage>;
};

export const ChatTile = ({ messages, accentColor, onSend }: ChatTileProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [containerRef, messages]);

	return (
		<div className="flex flex-col w-full h-full gap-4">
			<div
				ref={containerRef}
				className="overflow-y-auto"
				style={{
					height: `calc(100% - ${inputHeight}px)`,
				}}
			>
				<div className="flex flex-col justify-end min-h-full">
					{messages.map((message, index, allMsg) => {
						const hideName =
							index >= 1 && allMsg[index - 1].name === message.name;

						return (
							<ChatMessage
								key={message.timestamp}
								hideName={hideName}
								name={message.name}
								message={message.message}
								isSelf={message.isSelf}
								accentColor={accentColor}
							/>
						);
					})}
				</div>
			</div>
			<ChatMessageInput
				height={inputHeight}
				placeholder="Type a message"
				accentColor={accentColor}
				onSend={onSend}
			/>
		</div>
	);
};
