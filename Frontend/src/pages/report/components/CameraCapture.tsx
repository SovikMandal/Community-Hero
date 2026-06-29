import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { X, Aperture, SwitchCamera, Image as ImageIcon } from "lucide-react";

// Live camera capture using getUserMedia. Works on laptops and phones (unlike
// the file-input `capture` attribute, which only triggers on mobile).
export function CameraCapture({
  isDark,
  onCapture,
  onClose,
  onChooseFile,
}: {
  isDark: boolean;
  onCapture: (file: File) => void;
  onClose: () => void;
  onChooseFile: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Prefer the rear ("environment") camera when available.
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError(null);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser doesn't support camera access.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch {
        setError("Couldn't access the camera. Allow camera permission in your browser, or upload a file instead.");
      }
    }
    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" }));
        onClose();
      },
      "image/jpeg",
      0.92
    );
  };

  const flipBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[3000] flex flex-col"
      style={{ background: "#000" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-bold text-sm text-white">Take a photo</span>
        <button onClick={onClose} aria-label="Close" className="text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Full-screen video area */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6">
            <p className="text-sm text-white/90">{error}</p>
            <button
              onClick={onChooseFile}
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-2 text-white"
              style={{ background: "#2563EB" }}
            >
              <ImageIcon className="w-4 h-4" /> Upload a file instead
            </button>
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
                Starting camera…
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      {!error && (
        <div
          className="flex items-center justify-center gap-4 p-6"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
        >
          <button
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
            className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-4 py-2.5 text-white"
            style={{ background: flipBg }}
          >
            <SwitchCamera className="w-4 h-4" /> Flip
          </button>
          <button
            onClick={capture}
            disabled={!ready}
            className="inline-flex items-center gap-2 text-sm font-bold rounded-full px-6 py-3 text-white"
            style={{ background: "#2563EB", opacity: ready ? 1 : 0.6, boxShadow: "0 6px 20px rgba(37,99,235,0.35)" }}
          >
            <Aperture className="w-5 h-5" /> Capture
          </button>
        </div>
      )}
    </motion.div>
  );
}
