import DashboardLayout from "@/components/dashboard-layout";
import { useEffect, useState, useRef } from "react";
import { FaMicrophone, FaTrash, FaStop, FaPaperPlane } from "react-icons/fa";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

// Mock chat data
const initialMessages: ChatMessage[] = [
  {
    id: "1",
    type: "assistant",
    content:
      "Hello! I'm here to help. You can record your voice message and I'll transcribe it for you.",
    timestamp: new Date(Date.now() - 30000),
  },
  {
    id: "2",
    type: "user",
    content: "How does voice transcription work?",
    timestamp: new Date(Date.now() - 25000),
  },
  {
    id: "3",
    type: "assistant",
    content:
      "Voice transcription converts your spoken words into text using advanced AI. Simply click the microphone button, speak clearly, and I'll convert your speech to text that you can then send as a message.",
    timestamp: new Date(Date.now() - 20000),
  },
];

// Mock server responses
const mockResponses = [
  "That's a great question! Let me help you with that.",
  "I understand what you're asking. Here's what I think...",
  "Thanks for your message. Based on what you've said...",
  "Interesting point! I'd like to add that...",
  "I see where you're coming from. In my experience...",
];

export default function AudioPage() {
  const [isMicUse, setIsMicUse] = useState(false);
  const [time, setTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start recording
  const startMic = async () => {
    if (!audioCtx) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        setIsLoading(true);
        const text = await handleSendAudio(blob, "en");
        setTranscript(text || null);
        setIsLoading(false);
      };

      recorder.start();
      setMediaRecorder(recorder);

      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();
      analyserNode.fftSize = 2048;
      source.connect(analyserNode);

      setAudioCtx(context);
      setAnalyser(analyserNode);
      setMediaStream(stream);
    }
  };

  // Stop recording
  const stopMic = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (audioCtx) {
      audioCtx.close();
    }
    mediaRecorder?.stop();

    setAudioCtx(null);
    setAnalyser(null);
    setMediaStream(null);
    setIsMicUse(false);
  };

  // Send audio to backend
  const handleSendAudio = async (
    audioBlob: Blob,
    language: string,
    controller?: AbortController
  ) => {
    const formData = new FormData();
    const audioFile = new File([audioBlob], "audio.wav", { type: "audio/wav" });

    formData.append("file", audioFile);
    formData.append("language", language);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_AI_HANDLER_URL}/api/v1/audio`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        toast.error(
          `Server error (${response.status}): ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();
      return data.message;
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.error("Request was cancelled.");
      } else {
        toast.error("Network error: Failed to reach server");
      }
      return null;
    }
  };

  //send message
  const sendMessage = async (message: string, audioUrl?: string) => {
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
      audioUrl,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock server response
      const mockResponse =
        mockResponses[Math.floor(Math.random() * mockResponses.length)];

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: mockResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      toast.success("Message sent successfully!");

      // Clear after sending
      setTranscript(null);
      setAudioUrl(null);
      setAudioBlob(null);
      setTime(0);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    }
  };

  // Timer formatting
  const formatTime = (seconds: number) => {
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Timer update
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isMicUse) {
      interval = setInterval(() => setTime((prev) => prev + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMicUse]);

  // Request mic permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        console.error("Microphone permission denied:", error);
        toast.error("Microphone permission denied. Please allow mic access.");
      }
    };
    requestPermission();
  }, []);

  // Audio waveform
  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 3;
      ctx.strokeStyle = "red";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.stroke();
    };

    draw();
  }, [analyser]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Voice Chat</h1>
          <div className="text-sm text-gray-500">
            {messages.length} messages
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === "user" ?
                    "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.audioUrl && (
                  <audio controls className="w-full mt-2">
                    <source src={message.audioUrl} type="audio/webm" />
                    <track kind="captions" srcLang="en" label="English" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                <p
                  className={`text-xs mt-1 ${
                    message.type === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Recording Interface */}
        <div className="p-4 border-t border-gray-200">
          {/* Timer when recording */}
          {isMicUse && (
            <div className="flex items-center justify-center mb-4">
              <div className="font-mono text-2xl text-red-500">
                {formatTime(time)}
              </div>
            </div>
          )}

          {/* Audio Waveform */}
          {isMicUse && (
            <div className="flex justify-center mb-4">
              <canvas
                ref={canvasRef}
                width={300}
                height={80}
                className="border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isMicUse && !transcript && (
              <button
                className="flex items-center justify-center w-16 h-16 text-white transition-colors bg-blue-500 rounded-full hover:bg-blue-600"
                onClick={async () => {
                  setIsMicUse(true);
                  setIsRecording(true);
                  setTime(0);
                  await startMic();
                }}
              >
                <FaMicrophone size={24} />
              </button>
            )}

            {isMicUse && (
              <button
                className="flex items-center justify-center w-16 h-16 text-white transition-colors bg-red-500 rounded-full hover:bg-red-600"
                onClick={() => {
                  setIsMicUse(false);
                  setIsRecording(false);
                  stopMic();
                }}
              >
                <FaStop size={24} />
              </button>
            )}

            {audioUrl && !isMicUse && transcript && (
              <div className="flex gap-4">
                {/* Clear Button */}
                <button
                  className="flex items-center justify-center w-12 h-12 text-gray-600 transition-colors bg-gray-100 rounded-full hover:bg-gray-200"
                  onClick={() => {
                    setIsMicUse(false);
                    setIsRecording(false);
                    setTime(0);
                    setAudioUrl(null);
                    setAudioBlob(null);
                    setTranscript(null);
                  }}
                >
                  <FaTrash size={16} />
                </button>

                {/* Send Button */}
                <button
                  className="flex items-center justify-center w-12 h-12 text-white transition-colors bg-green-500 rounded-full hover:bg-green-600 disabled:bg-gray-300"
                  onClick={() =>
                    transcript && sendMessage(transcript, audioUrl)
                  }
                  disabled={isLoading || !transcript}
                >
                  <FaPaperPlane size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="w-4 h-4 border-2 border-gray-300 rounded-full border-t-blue-500 animate-spin"></div>
                <span className="text-sm">Transcribing audio...</span>
              </div>
            </div>
          )}

          {/* Transcript Preview */}
          {transcript && !isLoading && (
            <div className="p-3 mt-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="mb-1 text-sm text-gray-600">Transcribed text:</p>
              <p className="text-gray-900">{transcript}</p>
            </div>
          )}

          {/* Instructions */}
          {!isMicUse && !transcript && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Click the microphone to start recording your voice message
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
