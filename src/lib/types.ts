import type { LocalAudioTrack, LocalVideoTrack } from "livekit-client";

export interface SessionProps {
	roomName: string;
	identity: string;
	audioTrack?: LocalAudioTrack;
	videoTrack?: LocalVideoTrack;
	region?: string;
	turnServer?: RTCIceServer;
	forceRelay?: boolean;
}

export interface TokenResult {
	identity: string;
	accessToken: string;
}

export interface AttributeItem {
	id: string;
	key: string;
	value: string;
}

export interface EnvConfig {
	LIVEKIT_URL?: string;
	AI_HANDLER_URL?: string;
	LIVEKIT_API_KEY?: string;
	CHAT_SERVICE_URL?: string;
}
