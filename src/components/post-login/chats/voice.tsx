import {
  BarVisualizer,
  useConnectionState,
  useLocalParticipant,
  useRoomInfo,
  useTrackTranscription,
  useVoiceAssistant,
} from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BiSolidMicrophoneOff } from "react-icons/bi";
import { HiMicrophone } from "react-icons/hi2";
import { IoClose } from "react-icons/io5";
import { LoadingSVG } from "@/components/button/LoadingSVG";
import { useConnection } from "@/hooks/useConnection";
import { useWebSocketContext } from "@/lib/WebSocketProvider";

interface VoiceChatSectionProps {
  onFinishCall: () => void;
}

const VoiceChatSection = ({ onFinishCall }: VoiceChatSectionProps) => {
  const voiceAssistant = useVoiceAssistant();
  const roomState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const { name: roomName } = useRoomInfo();
  const { sendMessage } = useWebSocketContext();

  const { disconnect } = useConnection();

  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track agent transcriptions
  const agentTranscription = useTrackTranscription(voiceAssistant.audioTrack);
  const [currentTranscript, setCurrentTranscript] = useState<string>("");

  // Update current transcript from agent
  useEffect(() => {
    if (agentTranscription.segments.length > 0) {
      const latestSegment = agentTranscription.segments.at(-1);
      if (latestSegment) {
        setCurrentTranscript(
          latestSegment.final ? latestSegment.text : `${latestSegment.text} ...`
        );
      }
    }
  }, [agentTranscription.segments]);

  // Enable microphone when connected
  useEffect(() => {
    if (roomState === ConnectionState.Connected && localParticipant) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [roomState, localParticipant]);

  // Start timer when connected
  useEffect(() => {
    if (
      roomState === ConnectionState.Connected &&
      callStartTimeRef.current === null
    ) {
      callStartTimeRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(
            Math.floor((Date.now() - callStartTimeRef.current) / 1000)
          );
        }
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [roomState]);

  const handleToggleMute = useCallback(() => {
    if (localParticipant) {
      const newMutedState = !isMuted;
      localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    }
  }, [localParticipant, isMuted]);

  const handleEndCall = useCallback(() => {
    // Calculate final duration
    const durationSeconds =
      callStartTimeRef.current ?
        Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      : 0;

    // Send CALL_STATUS event
    const payload = {
      event: "CALL_STATUS",
      data: {
        status: "ENDCALL",
        durationSeconds,
        roomName: roomName || undefined,
      },
    };

    sendMessage(JSON.stringify(payload));

    // Clean up timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Reset state
    callStartTimeRef.current = null;
    setCallDuration(0);
    disconnect();
    setIsMuted(false);

    onFinishCall();
  }, [disconnect, onFinishCall, roomName, sendMessage]);

  const audioTileContent = useMemo(() => {
    console.log("Voice Debug:", {
      roomState,
      hasAudioTrack: !!voiceAssistant.audioTrack,
      state: voiceAssistant.state,
    });

    const disconnectedContent = (
      <div className="flex flex-col items-center justify-center w-full gap-2 text-center text-white/60">
        No agent audio track. Connect to get started.
      </div>
    );

    const waitingContent = (
      <div className="flex flex-col items-center w-full gap-2 text-center text-white/60">
        <LoadingSVG />
        Waiting for agent audio track…
      </div>
    );

    const visualizerContent = (
      <div className="flex items-center justify-center w-full h-full [--lk-va-bar-width:8px] [--lk-va-bar-gap:8px] [--lk-fg:#a78bfa]">
        <BarVisualizer
          state={voiceAssistant.state}
          trackRef={voiceAssistant.audioTrack}
          barCount={50}
          options={{ minHeight: 10 }}
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
  }, [voiceAssistant.audioTrack, roomState, voiceAssistant.state]);

  return (
    <div className="flex flex-col items-center justify-between h-full p-8 bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Center - Audio Visualizer */}
      <div className="flex items-center justify-center flex-1">
        <div className="relative">
          {/* Circular background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 to-blue-600/30 blur-3xl" />

          {/* Visualizer container */}
          <div className="relative flex items-center justify-center border rounded-full w-96 h-96 bg-gradient-to-br from-purple-900/50 to-blue-900/50 backdrop-blur-lg border-purple-500/30">
            {audioTileContent}
          </div>
        </div>
      </div>

      {/* Bottom - Status and Controls */}
      <div className="flex flex-col items-center space-y-6">
        {/* Agent Transcript */}
        {currentTranscript && (
          <div className="max-w-2xl px-6 py-3 text-center border rounded-lg bg-white/10 backdrop-blur-lg border-white/20">
            <p className="text-white">{currentTranscript}</p>
          </div>
        )}

        <div className="flex flex-col items-center space-y-2">
          {callDuration > 0 && (
            <p className="text-sm text-white/50">
              {Math.floor(callDuration / 60)}:
              {(callDuration % 60).toString().padStart(2, "0")}
            </p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-6">
          {/* Mute/Unmute Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 ${
              isMuted ?
                "bg-red-600 hover:bg-red-700"
              : "bg-purple-600/80 hover:bg-purple-700"
            } backdrop-blur-lg border-2 border-white/20`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ?
              <BiSolidMicrophoneOff className="w-8 h-8 text-white" />
            : <HiMicrophone className="w-8 h-8 text-white" />}
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleEndCall}
            className="flex items-center justify-center w-16 h-16 text-white transition-all duration-300 border-2 rounded-full bg-gray-700/80 hover:bg-gray-600 backdrop-blur-lg border-white/20"
            title="End call"
          >
            <IoClose className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceChatSection;
