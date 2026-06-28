import type { RefObject } from "react";
import { motion } from "motion/react";
import {
  Upload, MapPin, CheckCircle2, Camera, Search, Navigation,
  Check, AlertTriangle, AlertCircle, Lightbulb, Trash2,
  ChevronLeft, ChevronRight, MousePointer,
} from "lucide-react";
import type { ReportTheme } from "../theme";
import { UploadProgress } from "./UploadProgress";
import { LocationMap } from "./LocationMap";

interface UploadLocationStepProps {
  t: ReportTheme;
  isDark: boolean;
  fileRef: RefObject<HTMLInputElement | null>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onDrop: (e: React.DragEvent) => void;
  handleFile: (file: File) => void;
  uploadState: "idle" | "uploading" | "done";
  setUploadState: (v: "idle" | "uploading" | "done") => void;
  image: string | null;
  setImage: (v: string | null) => void;
  imageName: string;
  setCameraOpen: (v: boolean) => void;
  coords: { lat: number; lng: number } | null;
  location: string;
  setLocation: (v: string) => void;
  locating: boolean;
  locationError: string | null;
  handleUseGps: () => void;
  handlePickLocation: (lat: number, lng: number) => void;
  onBack: () => void;
  onNext: () => void;
}

// Slide 1 — capture/upload evidence and confirm the issue location.
export function UploadLocationStep({
  t, isDark, fileRef, dragOver, setDragOver, onDrop, handleFile,
  uploadState, setUploadState, image, setImage, imageName, setCameraOpen,
  coords, location, setLocation, locating, locationError, handleUseGps, handlePickLocation,
  onBack, onNext,
}: UploadLocationStepProps) {
  return (
    <motion.div key="s1"
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-5xl mx-auto w-full px-5 md:px-0 pb-28 sm:pb-8 pt-2">

      {/* Step heading */}
      <div className="mb-6">
        <span className="inline-block font-semibold rounded-full text-xs px-3 py-1 mb-2"
          style={{ background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.10)", color: "#2563EB" }}>
          Step 1 of 3
        </span>
        <h2 className="font-semibold text-xl" style={{ color: t.text }}>Upload Evidence &amp; Location</h2>
        <p className="text-sm mt-1" style={{ color: t.textSub }}>Capture or upload a photo, then confirm your location.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          {/* Upload card */}
          <div className="rounded-3xl border p-6 flex flex-col gap-4"
            style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-semibold text-base" style={{ color: t.text }}>Upload Image / Video</h3>
                <p className="text-sm" style={{ color: t.textSub }}>Drag and drop or capture evidence instantly.</p>
              </div>
              <span className="font-medium rounded-full text-xs px-3 py-1 flex-shrink-0"
                style={{ background: t.tagBg, color: t.textSub }}>Evidence</span>
            </div>

            {uploadState === "idle" && (
              <motion.div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                animate={{ scale: dragOver ? 1.01 : 1 }}
                className="rounded-2xl border-2 border-dashed p-8 cursor-pointer"
                style={{ background: dragOver ? (isDark ? "rgba(37,99,235,0.12)" : "#EFF6FF") : t.dropZone, borderColor: dragOver ? "#2563EB" : t.dropBorder }}>
                <div className="text-center flex flex-col justify-center items-center gap-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: isDark ? "rgba(37,99,235,0.14)" : "rgba(37,99,235,0.10)", color: "#2563EB" }}>
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg" style={{ color: t.text }}>{dragOver ? "Drop it here!" : "Drag & Drop"}</div>
                    <div className="text-sm mt-1" style={{ color: t.textSub }}>or choose an option below</div>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button type="button" onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                      className="inline-flex font-semibold rounded-full text-sm px-4 py-2 items-center gap-2 text-white cursor-pointer"
                      style={{ background: "#2563EB", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
                      <Upload className="w-4 h-4" /> Upload Image
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setCameraOpen(true); }}
                      className="inline-flex font-semibold rounded-full text-sm px-4 py-2 items-center gap-2 cursor-pointer"
                      style={{ background: t.card, color: t.text, border: `1px solid ${t.inputBorder}` }}>
                      <Camera className="w-4 h-4" /> Open Camera
                    </button>
                  </div>
                  <p className="text-xs" style={{ color: t.textMuted }}>PNG, JPG, HEIC, MP4 · Max 20 MB</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </motion.div>
            )}

            {uploadState === "uploading" && <UploadProgress onDone={() => setUploadState("done")} />}

            {uploadState === "done" && image && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border overflow-hidden" style={{ borderColor: t.inputBorder }}>
                  <img src={image} alt="Uploaded issue" className="object-cover w-full h-40" />
                </div>
                <div className="rounded-2xl border flex p-4 flex-col justify-between"
                  style={{ background: t.lockedBg, borderColor: t.inputBorder }}>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: t.text }}>Uploaded Image</div>
                    <div className="text-xs flex mt-1 items-center gap-1" style={{ color: t.textSub }}>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Ready for analysis
                    </div>
                    <div className="text-xs mt-2 truncate" style={{ color: t.textSub }}>{imageName}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { setUploadState("idle"); setImage(null); }}
                      className="font-medium rounded-full text-xs px-3 py-1.5"
                      style={{ background: t.card, color: t.text, border: `1px solid ${t.inputBorder}` }}>Remove</button>
                    <button onClick={() => fileRef.current?.click()}
                      className="font-medium rounded-full text-xs px-3 py-1.5"
                      style={{ background: t.card, color: t.text, border: `1px solid ${t.inputBorder}` }}>Replace</button>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) { setUploadState("idle"); setImage(null); setTimeout(() => handleFile(e.target.files![0]), 50); } }} />
                </div>
              </div>
            )}
          </div>

          {/* Quality check card (after upload) */}
          {uploadState === "done" && (
            <div className="rounded-3xl border p-6 flex flex-col gap-3"
              style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-semibold text-base" style={{ color: t.text }}>Image Quality Check</h3>
                  <p className="text-sm" style={{ color: t.textSub }}>AI validates clarity, brightness, and metadata.</p>
                </div>
                <span className="font-semibold rounded-full text-xs px-3 py-1 flex-shrink-0"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#059669" }}>96% confidence</span>
              </div>
              <div className="rounded-2xl p-4"
                style={{ background: isDark ? "rgba(16,185,129,0.08)" : "#ECFDF5", border: `1px solid ${isDark ? "rgba(16,185,129,0.20)" : "#A7F3D0"}` }}>
                <div className="font-semibold text-sm flex mb-3 items-center gap-2" style={{ color: isDark ? "#34D399" : "#047857" }}>
                  <CheckCircle2 className="w-4 h-4" /> AI Image Quality — Passed
                </div>
                <div className="flex flex-col gap-2">
                  {["Clear — No blur detected", "Bright — Good lighting", "GPS Available — Location embedded"].map(txt => (
                    <div key={txt} className="text-sm flex items-center gap-2" style={{ color: isDark ? "#6EE7B7" : "#047857" }}>
                      <Check className="w-4 h-4" /> {txt}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-4"
                style={{ background: isDark ? "rgba(245,158,11,0.08)" : "#FFFBEB", border: `1px solid ${isDark ? "rgba(245,158,11,0.20)" : "#FDE68A"}` }}>
                <div className="font-semibold text-sm flex items-center gap-2" style={{ color: isDark ? "#FBBF24" : "#B45309" }}>
                  <AlertTriangle className="w-4 h-4" /> Tip: Ensure the full damage is visible
                </div>
                <p className="text-xs mt-1" style={{ color: isDark ? "#FCD34D" : "#D97706" }}>Wider angle shots improve AI detection accuracy.</p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Location */}
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border p-6 flex flex-col gap-4"
            style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}>
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="font-semibold text-base" style={{ color: t.text }}>Location</h3>
                <p className="text-sm" style={{ color: t.textSub }}>Confirm where the issue is located.</p>
              </div>
              <button onClick={handleUseGps} className="font-medium rounded-full text-xs px-3 py-1.5"
                style={{ background: t.tagBg, color: t.text }}>Change</button>
            </div>

            {/* Interactive map */}
            <div className="relative rounded-2xl overflow-hidden border" style={{ height: 260, borderColor: t.inputBorder }}>
              <LocationMap lat={coords?.lat ?? 22.5726} lng={coords?.lng ?? 88.3639} onPick={handlePickLocation} isDark={isDark} />
              <div className="font-medium rounded-full text-xs flex absolute left-3 top-3 px-3 py-1.5 items-center gap-1 z-[1000] pointer-events-none shadow"
                style={{ background: "rgba(255,255,255,0.92)", color: "#0F172A" }}>
                <MapPin className="w-3 h-3 text-blue-500" /> Tap or drag to set
              </div>
              <div className="rounded-xl absolute left-3 bottom-3 right-3 px-3 py-2 z-[1000] pointer-events-none shadow-lg"
                style={{ background: isDark ? "rgba(19,31,53,0.95)" : "rgba(255,255,255,0.95)", border: `1px solid ${t.cardBorder}` }}>
                <div className="font-semibold text-sm truncate" style={{ color: t.text }}>{location}</div>
                <div className="text-xs truncate" style={{ color: locationError ? "#EF4444" : t.textSub }}>
                  {locating
                    ? "Locating you…"
                    : locationError
                    ? locationError
                    : coords
                    ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                    : "Tap “Use GPS Location” or pick a spot on the map"}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={handleUseGps} disabled={locating}
                className="inline-flex font-semibold rounded-xl text-sm px-4 py-2.5 justify-center items-center gap-2 w-full text-white"
                style={{ background: "#2563EB", opacity: locating ? 0.75 : 1, cursor: locating ? "wait" : "pointer" }}>
                {locating ? (
                  <>
                    <motion.div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} />
                    Locating…
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" /> Use GPS Location
                  </>
                )}
              </button>
              <div className="rounded-xl border flex px-4 py-2.5 items-center gap-2"
                style={{ background: t.inputBg, borderColor: t.inputBorder }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
                <input placeholder="Search address..." value={location} onChange={e => setLocation(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none" style={{ color: t.text, fontFamily: "Inter, sans-serif" }} />
              </div>
              <div className="rounded-xl border flex px-4 py-2.5 items-center gap-2"
                style={{ background: t.inputBg, borderColor: t.inputBorder }}>
                <MousePointer className="w-4 h-4 flex-shrink-0" style={{ color: t.textMuted }} />
                <span className="text-sm" style={{ color: t.textSub }}>Drag pin on map</span>
              </div>
            </div>

            <div>
              <div className="font-semibold text-xs mb-2" style={{ color: t.textSub }}>Nearby Issues</div>
              <div className="flex flex-wrap gap-2">
                <span className="font-medium rounded-full text-xs flex px-3 py-1 items-center gap-1"
                  style={{ background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.10)", color: "#2563EB" }}>
                  <AlertCircle className="w-3 h-3" /> Pothole · 120m
                </span>
                <span className="font-medium rounded-full text-xs flex px-3 py-1 items-center gap-1"
                  style={{ background: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.10)", color: "#2563EB" }}>
                  <Lightbulb className="w-3 h-3" /> Broken Light · 200m
                </span>
                <span className="font-medium rounded-full text-xs flex px-3 py-1 items-center gap-1"
                  style={{ background: t.tagBg, color: t.textSub }}>
                  <Trash2 className="w-3 h-3" /> Garbage · 350m
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="flex justify-between items-center mt-6 pt-5" style={{ borderTop: `1px solid ${t.divider}` }}>
        <button onClick={onBack}
          className="inline-flex font-semibold rounded-xl text-sm px-6 py-3 items-center gap-2 cursor-pointer"
          style={{ background: t.tagBg, color: t.textSub }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="rounded-full w-8 h-1.5" style={{ background: "#2563EB" }} />
            <div className="rounded-full w-4 h-1.5" style={{ background: t.tagBg }} />
            <div className="rounded-full w-4 h-1.5" style={{ background: t.tagBg }} />
          </div>
          <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="inline-flex font-semibold rounded-xl text-sm px-6 py-3 items-center gap-2 text-white cursor-pointer"
            style={{ background: "#2563EB", boxShadow: "0 4px 16px rgba(37,99,235,0.30)" }}>
            Next <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
