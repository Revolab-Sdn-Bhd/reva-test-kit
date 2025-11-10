"use client";

import {
	BarVisualizer,
	useConnectionState,
	useDataChannel,
	useLocalParticipant,
	useParticipantAttributes,
	useRoomContext,
	useRoomInfo,
	useTracks,
	useVoiceAssistant,
	VideoTrack,
} from "@livekit/components-react";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { QRCodeSVG } from "qrcode.react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import type { ChatMessageType } from "@/components/chat/ChatTile";
import { ColorPicker } from "@/components/colorPicker/ColorPicker";
import { AttributesInspector } from "@/components/config/AttributesInspector";
import { AudioInputTile } from "@/components/config/AudioInputTile";
import { ConfigurationPanelItem } from "@/components/config/ConfigurationPanelItem";
import {
	EditableNameValueRow,
	NameValueRow,
} from "@/components/config/NameValueRow";
import { PlaygroundHeader } from "@/components/playground/PlaygroundHeader";
import {
	type PlaygroundTab,
	PlaygroundTabbedTile,
	PlaygroundTile,
} from "@/components/playground/PlaygroundTile";
import { TranscriptionTile } from "@/components/transcriptions/TranscriptionTile";
import { useConfig } from "@/hooks/useConfig";
import { useLivekitData } from "@/hooks/useLivekitData";
import tailwindTheme from "../../lib/tailwindTheme.preval";

export interface PlaygroundMeta {
	name: string;
	value: string;
}

export interface PlaygroundProps {
	logo?: ReactNode;
	themeColors: string[];
	onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

const headerHeight = 56;

export default function Playground({
	logo,
	themeColors,
	onConnect,
}: PlaygroundProps) {
	const { config, setUserSettings } = useConfig();
	const { name } = useRoomInfo();
	const [transcripts, setTranscripts] = useState<ChatMessageType[]>([]);
	const { localParticipant } = useLocalParticipant();

	const voiceAssistant = useVoiceAssistant();
	const state = voiceAssistant.state;

	const roomState = useConnectionState();
	const tracks = useTracks();
	const room = useRoomContext();

	const [rpcMethod, setRpcMethod] = useState("");
	const [rpcPayload, setRpcPayload] = useState("");
	const [showRpc, setShowRpc] = useState(false);

	useEffect(() => {
		if (roomState === ConnectionState.Connected) {
			localParticipant.setCameraEnabled(config.settings.inputs.camera);
			localParticipant.setMicrophoneEnabled(config.settings.inputs.mic);
		}
	}, [config, localParticipant, roomState]);

	useLivekitData(room);

	const agentVideoTrack = tracks.find(
		(trackRef) =>
			trackRef.publication.kind === Track.Kind.Video &&
			trackRef.participant.isAgent,
	);

	const localTracks = tracks.filter(
		({ participant }) => participant instanceof LocalParticipant,
	);
	const localCameraTrack = localTracks.find(
		({ source }) => source === Track.Source.Camera,
	);
	const localScreenTrack = localTracks.find(
		({ source }) => source === Track.Source.ScreenShare,
	);
	const localMicTrack = localTracks.find(
		({ source }) => source === Track.Source.Microphone,
	);

	const onDataReceived = useCallback(
		(msg: any) => {
			if (msg.topic === "transcription") {
				const decoded = JSON.parse(
					new TextDecoder("utf-8").decode(msg.payload),
				);
				let timestamp = Date.now();
				if ("timestamp" in decoded && decoded.timestamp > 0) {
					timestamp = decoded.timestamp;
				}
				setTranscripts([
					...transcripts,
					{
						name: "You",
						message: decoded.text,
						timestamp: timestamp,
						isSelf: true,
					},
				]);
			}
		},
		[transcripts],
	);

	useDataChannel(onDataReceived);

	const videoTileContent = useMemo(() => {
		const videoFitClassName = `object-${config.video_fit || "contain"}`;

		const disconnectedContent = (
			<div className="flex items-center justify-center w-full h-full text-center text-gray-700">
				No agent video track. Connect to get started.
			</div>
		);

		const loadingContent = (
			<div className="flex flex-col items-center justify-center w-full h-full gap-2 text-center text-gray-700">
				<LoadingSVG />
				Waiting for agent video track…
			</div>
		);

		const videoContent = (
			<VideoTrack
				trackRef={agentVideoTrack}
				className={`absolute top-1/2 -translate-y-1/2 ${videoFitClassName} object-position-center w-full h-full`}
			/>
		);

		let content = null;
		if (roomState === ConnectionState.Disconnected) {
			content = disconnectedContent;
		} else if (agentVideoTrack) {
			content = videoContent;
		} else {
			content = loadingContent;
		}

		return (
			<div className="relative flex flex-col w-full bg-black border border-gray-800 rounded-sm grow text-gray-950">
				{content}
			</div>
		);
	}, [agentVideoTrack, config, roomState]);

	useEffect(() => {
		document.body.style.setProperty(
			"--lk-theme-color",
			// @ts-expect-error
			tailwindTheme.colors[config.settings.theme_color]["500"],
		);
		document.body.style.setProperty(
			"--lk-drop-shadow",
			`var(--lk-theme-color) 0px 0px 18px`,
		);
	}, [config.settings.theme_color]);

	const audioTileContent = useMemo(() => {
		const disconnectedContent = (
			<div className="flex flex-col items-center justify-center w-full gap-2 text-center text-gray-700">
				No agent audio track. Connect to get started.
			</div>
		);

		const waitingContent = (
			<div className="flex flex-col items-center w-full gap-2 text-center text-gray-700">
				<LoadingSVG />
				Waiting for agent audio track…
			</div>
		);

		const visualizerContent = (
			<div
				className={`flex items-center justify-center w-full h-48 [--lk-va-bar-width:30px] [--lk-va-bar-gap:20px] [--lk-fg:var(--lk-theme-color)]`}
			>
				<BarVisualizer
					state={voiceAssistant.state}
					trackRef={voiceAssistant.audioTrack}
					barCount={5}
					options={{ minHeight: 20 }}
				/>
			</div>
		);

		if (roomState === ConnectionState.Disconnected) {
			return disconnectedContent;
		}

		if (!voiceAssistant.audioTrack) {
			return waitingContent;
		}

		return visualizerContent;
	}, [
		voiceAssistant.audioTrack,
		config.settings.theme_color,
		roomState,
		voiceAssistant.state,
	]);

	const chatTileContent = useMemo(() => {
		if (voiceAssistant.agent) {
			return (
				<TranscriptionTile
					agentAudioTrack={voiceAssistant.audioTrack}
					accentColor={config.settings.theme_color}
				/>
			);
		}
		return null;
	}, [
		config.settings.theme_color,
		voiceAssistant.audioTrack,
		voiceAssistant.agent,
	]);

	const handleRpcCall = useCallback(async () => {
		if (!voiceAssistant.agent || !room) {
			throw new Error("No agent or room available");
		}

		const response = await room.localParticipant.performRpc({
			destinationIdentity: voiceAssistant.agent.identity,
			method: rpcMethod,
			payload: rpcPayload,
		});
		return response;
	}, [room, rpcMethod, rpcPayload, voiceAssistant.agent]);

	const agentAttributes = useParticipantAttributes({
		participant: voiceAssistant.agent,
	});

	const settingsTileContent = useMemo(() => {
		return (
			<div className="flex flex-col items-start w-full h-full overflow-y-auto">
				{config.description && (
					<ConfigurationPanelItem title="Description">
						{config.description}
					</ConfigurationPanelItem>
				)}

				<ConfigurationPanelItem title="Room">
					<div className="flex flex-col gap-2">
						<EditableNameValueRow
							name="Room name"
							value={
								roomState === ConnectionState.Connected
									? name
									: config.settings.room_name
							}
							valueColor={`${config.settings.theme_color}-500`}
							onValueChange={(value) => {
								const newSettings = { ...config.settings };
								newSettings.room_name = value;
								setUserSettings(newSettings);
							}}
							placeholder="Auto"
							editable={roomState !== ConnectionState.Connected}
						/>
						<NameValueRow
							name="Status"
							value={
								roomState === ConnectionState.Connecting ? (
									<LoadingSVG diameter={16} strokeWidth={2} />
								) : (
									roomState.charAt(0).toUpperCase() + roomState.slice(1)
								)
							}
							valueColor={
								roomState === ConnectionState.Connected
									? `${config.settings.theme_color}-500`
									: "gray-500"
							}
						/>
					</div>
				</ConfigurationPanelItem>

				<ConfigurationPanelItem title="Agent">
					<div className="flex flex-col gap-2">
						<EditableNameValueRow
							name="Agent name"
							value={
								roomState === ConnectionState.Connected
									? config.settings.agent_name || "None"
									: config.settings.agent_name || ""
							}
							valueColor={`${config.settings.theme_color}-500`}
							onValueChange={(value) => {
								const newSettings = { ...config.settings };
								newSettings.agent_name = value;
								setUserSettings(newSettings);
							}}
							placeholder="None"
							editable={roomState !== ConnectionState.Connected}
						/>
						<NameValueRow
							name="Identity"
							value={
								voiceAssistant.agent ? (
									voiceAssistant.agent.identity
								) : roomState === ConnectionState.Connected ? (
									<LoadingSVG diameter={12} strokeWidth={2} />
								) : (
									"No agent connected"
								)
							}
							valueColor={
								voiceAssistant.agent
									? `${config.settings.theme_color}-500`
									: "gray-500"
							}
						/>
						{roomState === ConnectionState.Connected &&
							voiceAssistant.agent && (
								<AttributesInspector
									attributes={Object.entries(
										agentAttributes.attributes || {},
									).map(([key, value], index) => ({
										id: `agent-attr-${index}`,
										key,
										value: String(value),
									}))}
									onAttributesChange={() => {}}
									themeColor={config.settings.theme_color}
									disabled={true}
								/>
							)}
						<p className="text-xs text-right text-gray-500">
							Set an agent name to use{" "}
							<a
								href="https://docs.livekit.io/agents/worker/dispatch#explicit"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-500 underline hover:text-gray-300"
							>
								explicit dispatch
							</a>
							.
						</p>
					</div>
				</ConfigurationPanelItem>

				<ConfigurationPanelItem title="User">
					<div className="flex flex-col gap-2">
						<EditableNameValueRow
							name="Name"
							value={
								roomState === ConnectionState.Connected
									? localParticipant?.name || ""
									: config.settings.participant_name || ""
							}
							valueColor={`${config.settings.theme_color}-500`}
							onValueChange={(value) => {
								const newSettings = { ...config.settings };
								newSettings.participant_name = value;
								setUserSettings(newSettings);
							}}
							placeholder="Auto"
							editable={roomState !== ConnectionState.Connected}
						/>
						<EditableNameValueRow
							name="Identity"
							value={
								roomState === ConnectionState.Connected
									? localParticipant?.identity || ""
									: config.settings.participant_id || ""
							}
							valueColor={`${config.settings.theme_color}-500`}
							onValueChange={(value) => {
								const newSettings = { ...config.settings };
								newSettings.participant_id = value;
								setUserSettings(newSettings);
							}}
							placeholder="Auto"
							editable={roomState !== ConnectionState.Connected}
						/>
						<AttributesInspector
							attributes={config.settings.attributes || []}
							onAttributesChange={(newAttributes) => {
								const newSettings = { ...config.settings };
								newSettings.attributes = newAttributes;
								setUserSettings(newSettings);
							}}
							metadata={config.settings.metadata}
							onMetadataChange={(metadata) => {
								const newSettings = { ...config.settings };
								newSettings.metadata = metadata;
								setUserSettings(newSettings);
							}}
							themeColor={config.settings.theme_color}
							disabled={false}
							connectionState={roomState}
						/>
					</div>
				</ConfigurationPanelItem>

				{/* {roomState === ConnectionState.Connected &&
          config.settings.inputs.screen && (
            <ConfigurationPanelItem
              title="Screen"
              source={Track.Source.ScreenShare}
            >
              {localScreenTrack ? (
                <div className="relative">
                  <VideoTrack
                    className="w-full border border-gray-800 rounded-sm opacity-70"
                    trackRef={localScreenTrack}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-full h-full text-center text-gray-700">
                  Press the button above to share your screen.
                </div>
              )}
            </ConfigurationPanelItem>
          )} */}
				{/* {roomState === ConnectionState.Connected && voiceAssistant.agent && (
          <RpcPanel
            config={config}
            rpcMethod={rpcMethod}
            rpcPayload={rpcPayload}
            setRpcMethod={setRpcMethod}
            setRpcPayload={setRpcPayload}
            handleRpcCall={handleRpcCall}
          />
        )} */}
				{/* {localCameraTrack && (
          <ConfigurationPanelItem title="Camera" source={Track.Source.Camera}>
            <div className="relative">
              <VideoTrack
                className="w-full border border-gray-800 rounded-sm opacity-70"
                trackRef={localCameraTrack}
              />
            </div>
          </ConfigurationPanelItem>
        )} */}
				{localMicTrack && (
					<ConfigurationPanelItem
						title="Microphone"
						source={Track.Source.Microphone}
					>
						<AudioInputTile trackRef={localMicTrack} />
					</ConfigurationPanelItem>
				)}
				<div className="w-full">
					<ConfigurationPanelItem title="Color">
						<ColorPicker
							colors={themeColors}
							selectedColor={config.settings.theme_color}
							onSelect={(color) => {
								const userSettings = { ...config.settings };
								userSettings.theme_color = color;
								setUserSettings(userSettings);
							}}
						/>
					</ConfigurationPanelItem>
				</div>
				{config.show_qr && (
					<div className="w-full">
						<ConfigurationPanelItem title="QR Code">
							<QRCodeSVG value={window.location.href} width="128" />
						</ConfigurationPanelItem>
					</div>
				)}
			</div>
		);
	}, [
		config.description,
		config.settings,
		config.show_qr,
		localParticipant,
		name,
		roomState,
		localCameraTrack,
		localScreenTrack,
		localMicTrack,
		themeColors,
		setUserSettings,
		voiceAssistant.agent,
		rpcMethod,
		rpcPayload,
		handleRpcCall,
		showRpc,
		setShowRpc,
	]);

	const mobileTabs: PlaygroundTab[] = [];
	if (config.settings.outputs.video) {
		mobileTabs.push({
			title: "Video",
			content: (
				<PlaygroundTile
					className="w-full h-full grow"
					childrenClassName="justify-center"
				>
					{videoTileContent}
				</PlaygroundTile>
			),
		});
	}

	if (config.settings.outputs.audio) {
		mobileTabs.push({
			title: "Audio",
			content: (
				<PlaygroundTile
					className="w-full h-full grow"
					childrenClassName="justify-center"
				>
					{audioTileContent}
				</PlaygroundTile>
			),
		});
	}

	if (config.settings.chat) {
		mobileTabs.push({
			title: "Chat",
			content: chatTileContent,
		});
	}

	mobileTabs.push({
		title: "Settings",
		content: (
			<PlaygroundTile
				padding={false}
				backgroundColor="gray-950"
				className="flex items-start w-full h-full overflow-y-auto basis-1/4"
				childrenClassName="h-full grow items-start"
			>
				{settingsTileContent}
			</PlaygroundTile>
		),
	});

	return (
		<>
			<PlaygroundHeader
				title={config.title}
				logo={logo}
				githubLink={config.github_link}
				height={headerHeight}
				accentColor={config.settings.theme_color}
				connectionState={roomState}
				onConnectClicked={() =>
					onConnect(roomState === ConnectionState.Disconnected)
				}
			/>
			<div
				className={`flex gap-4 py-4 grow w-full selection:bg-${config.settings.theme_color}-900`}
				style={{ height: `calc(100% - ${headerHeight}px)` }}
			>
				<div className="flex flex-col h-full gap-4 grow basis-1/2 lg:hidden">
					<PlaygroundTabbedTile
						className="h-full"
						tabs={mobileTabs}
						initialTab={mobileTabs.length - 1}
					/>
				</div>
				<div
					className={`flex-col grow basis-1/2 gap-4 h-full hidden lg:${
						!config.settings.outputs.audio && !config.settings.outputs.video
							? "hidden"
							: "flex"
					}`}
				>
					{/* {config.settings.outputs.video && (
						<PlaygroundTile
							title="Agent Video"
							className="w-full h-full grow"
							childrenClassName="justify-center"
						>
							{videoTileContent}
						</PlaygroundTile>
					)} */}
					{config.settings.outputs.audio && (
						<PlaygroundTile
							title="Agent Audio"
							className="w-full h-full grow"
							childrenClassName="justify-center"
						>
							{audioTileContent}
						</PlaygroundTile>
					)}
				</div>

				{config.settings.chat && (
					<PlaygroundTile
						title="Chat"
						className="hidden h-full grow basis-1/4 lg:flex"
					>
						{chatTileContent}
					</PlaygroundTile>
				)}
				<PlaygroundTile
					padding={false}
					backgroundColor="gray-950"
					className="h-full w-full basis-1/4 items-start overflow-y-auto hidden max-w-[480px] lg:flex"
					childrenClassName="h-full grow items-start"
				>
					{settingsTileContent}
				</PlaygroundTile>
			</div>
		</>
	);
}
