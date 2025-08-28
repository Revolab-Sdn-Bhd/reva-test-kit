import { useEffect, useState, useRef } from "react";
import { FaMicrophone, FaTrash, FaStop, FaPaperPlane } from "react-icons/fa";
import {  useToast } from "@/components/toast/ToasterProvider";



export function AudioPageInner() {
  const [isMicUse, setIsMicUse] = useState(false);
  const [time, setTime] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toastMessage, setToastMessage } = useToast();


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
  const handleSendAudio = async (audioBlob: Blob, language: string, controller?: AbortController) => {
    const formData = new FormData();
    const audioFile = new File([audioBlob], "audio.wav", { type: "audio/wav" });

    formData.append("file", audioFile);
    formData.append("language", language);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AI_HANDLER_URL}/api/v1/audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        setToastMessage({
          message: `Server error (${response.status}): ${response.statusText}`,
          type: "error",
        });
        return null;
      }

      const data = await response.json();
      return data.message;
    } catch (err: any) {
      if (err.name === "AbortError") {
        setToastMessage({
          message: "Request was cancelled.",
          type: "error",
        });
      } else {
        setToastMessage({
          message: "Network error: Failed to reach server",
          type: "error",
        });
      }
      return null;
    }
  };

  //send message
  const sendMessage = async (message: string) => {
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });

      if (!res.ok) {
        setToastMessage({
          message: `Failed to send message (${res.status})`,
          type: "error",
        });
        return;
      }

      setToastMessage({
        message: "Message sent successfully!",
        type: "success",
      });

      // Clear after sending
      setTranscript(null);
      setAudioUrl(null);
      setAudioBlob(null);
    } catch (err) {
      setToastMessage({
        message: "Network error while sending message",
        type: "error",
      });
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
        setToastMessage({
          message: "Microphone permission denied. Please allow mic access.",
          type: "error",
        });
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

    <div className="flex flex-col items-center  w-6 h-25 p-4">
      {/* Timer */}
      <div className="text-3xl font-mono mb-4">{formatTime(time)}</div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <canvas
          ref={canvasRef}
          width={200}
          height={100}
          className="border border-gray-700 rounded"
        />

        {isMicUse ? (
          <button
            className="h-12 w-12 sm:h-24 sm:w-24  bg-red-500 text-white rounded-full flex items-center justify-center"
            onClick={() => {
              setIsMicUse(false);
              stopMic();
            }}
          >
            <FaStop size={24} />
          </button>
        ) : (
          <button
            className="h-12 w-12 sm:h-24 sm:w-24 bg-red-500 text-white rounded-full flex items-center justify-center"
            onClick={async () => {
              setIsMicUse(true);
              setTime(0);
              await startMic();
            }}
          >
            <FaMicrophone size={24} />
          </button>
        )}

        {audioUrl && !isMicUse && (
          <div className="flex gap-4">
            {/* Trash Button */}
            <button
              className="h-12 w-12 sm:h-24 sm:w-24  bg-white text-black rounded-full flex items-center justify-center"
              onClick={() => {
                setIsMicUse(false);
                setTime(0);
                setAudioUrl(null);
                setAudioBlob(null);
                setTranscript(null);
              }}
            >
              <FaTrash size={24} />
            </button>

            {/* Send Button */}
            <button
              className="h-12 w-12 sm:h-24 sm:w-24 bg-green-500 text-white rounded-full flex items-center justify-center"
              onClick={() => transcript && sendMessage(transcript)}
              disabled={isLoading || !transcript}
            >
              <FaPaperPlane size={24} />
            </button>
          </div>
        )}

        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center text-white text-xs animate-pulse">
            Transcribing...
          </span>
        )}
      </div>


      {/* Transcript */}
      {transcript && (
        <div className="mt-4 p-3 bg-gray-800 rounded-lg max-w-lg text-center">
          {transcript}
        </div>
      )}
    </div>
  );
}
