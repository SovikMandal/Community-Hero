import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { tk } from "./theme";
import { CameraCapture } from "./components/CameraCapture";
import { SuccessScreen } from "./components/SuccessScreen";
import { UploadLocationStep } from "./components/UploadLocationStep";
import { AIAnalysisStep } from "./components/AIAnalysisStep";
import { ReviewSubmitStep } from "./components/ReviewSubmitStep";
import {
  issues as issuesApi,
  ApiError,
  categoryLabel,
  severityColor,
  type Issue,
  type AnalyzeResult,
  type Severity,
} from "../../lib";

interface ReportIssuePageProps {
  isDark: boolean;
  onBack: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export function ReportIssuePage({ isDark, onBack }: ReportIssuePageProps) {
  const t = tk(isDark);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Upload state
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done">("idle");
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");

  // User-editable fields
  const [description, setDescription] = useState("");
  const [location, setLocation]     = useState("");

  // AI-derived fields come from the backend /analyze response.
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // AI analysis attempt finished (success or error) → reveal the results view.
  const [aiDone, setAiDone] = useState(false);

  // Submitted
  const [submitted, setSubmitted] = useState(false);

  // ── Real submission state ──────────────────────────────────────────────────
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateFound, setDuplicateFound] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<Issue | null>(null);
  const [anonymous, setAnonymous] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return;
    setMediaFile(file);
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setUploadState("uploading");
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  // Kick off AI when entering step 2
  // Run the real AI analysis when the user reaches slide 2 (once).
  const runAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    const point = coords ?? { lat: 22.5726, lng: 88.3639 };
    try {
      const result = await issuesApi.analyze({
        description: description.trim() || "Civic issue reported — analyze image for details.",
        latitude: point.lat,
        longitude: point.lng,
        files: mediaFile ? [mediaFile] : [],
      });
      setAnalysis(result);
      if (result.summary && !description.trim()) setDescription(result.summary);
      if (!result.aiAvailable) {
        setAnalyzeError("AI service is temporarily unavailable (high demand). Results shown are defaults — try again in a minute.");
      }
    } catch (err) {
      setAnalyzeError(
        err instanceof ApiError && err.status === 401
          ? "Please sign in to run AI analysis."
          : err instanceof ApiError
          ? err.message
          : "Analysis failed — is the backend running?"
      );
    } finally {
      setAnalyzing(false);
      setAiDone(true);
    }
  }, [coords, description, mediaFile]);

  useEffect(() => {
    if (step === 2 && !analysis && !analyzing && !aiDone) runAnalyze();
  }, [step, analysis, analyzing, aiDone, runAnalyze]);

  // Resolve a lat/lng to a human-readable address (OpenStreetMap, no API key).
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) setLocation(data.display_name);
      }
    } catch {
      /* keep the raw coordinates if reverse geocoding fails */
    }
  };

  // Set the pin (from GPS, a map click, or a marker drag) + resolve its address.
  const handlePickLocation = async (lat: number, lng: number) => {
    setLocationError(null);
    setCoords({ lat, lng });
    await reverseGeocode(lat, lng);
  };

  // Enable device location: request permission, capture GPS, resolve address.
  const handleUseGps = () => {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported by this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await handlePickLocation(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enable location access in your browser, or pick the spot on the map / type it manually."
            : "Couldn't read your location. Pick the spot on the map or type the address."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Auto-detect location on mount
  useEffect(() => {
    if (!coords && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await handlePickLocation(pos.coords.latitude, pos.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
      );
    }
  }, []);

  // Submit the report to POST /api/issues (runs the backend AI pipeline).
  const handleSubmit = async (force = false) => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const category = analysis?.category;
    // Fallback to a default point if GPS wasn't captured (kept submit-able).
    const point = coords ?? { lat: 22.5726, lng: 88.3639 };

    try {
      const { issue } = await issuesApi.create({
        title: `${issueTypeLabel} — ${location}`.slice(0, 140),
        description: description.trim(),
        latitude: point.lat,
        longitude: point.lng,
        address: location,
        category,
        forceCreate: force,
        files: mediaFile ? [mediaFile] : [],
      });
      setCreatedIssue(issue);
      setSubmitted(true);
      toast.success("Report submitted successfully!");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDuplicateFound(true);
        const dup = err.body?.duplicate as { distanceMeters?: number } | undefined;
        setSubmitError(
          `A similar issue already exists nearby${
            dup?.distanceMeters != null ? ` (~${dup.distanceMeters}m away)` : ""
          }. Submit anyway to report it regardless.`
        );
      } else if (err instanceof ApiError && err.status === 401) {
        setSubmitError("Please sign in to submit a report.");
      } else {
        setSubmitError(
          err instanceof ApiError ? err.message : "Submission failed — is the backend running on port 5000?"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Display values derived from the AI analysis (with safe fallbacks).
  const sev: Severity = analysis?.severity ?? "MEDIUM";
  const severityLabel = sev.charAt(0) + sev.slice(1).toLowerCase();
  const sevColor = severityColor(sev);
  const issueTypeLabel = analysis ? categoryLabel(analysis.category) : "Pending";
  const departmentLabel = analysis?.department ?? "Pending";
  const dupCount = analysis?.duplicates?.length ?? 0;
  const summaryText = analysis?.summary || description;
  const priorityScore = Math.round(analysis?.priorityScore ?? 0);
  const priorityLevel = analysis?.priority ?? "—";
  const riskLevel = analysis?.risk ?? "MEDIUM";
  const riskLabel = riskLevel.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");

  // Find a close duplicate (within 100m, same category) for merge suggestion
  const mergeDuplicate = analysis?.duplicates?.[0] ?? null;

  // Merge = support the existing duplicate issue + upload photo to it
  const handleMerge = async () => {
    if (!mergeDuplicate || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await issuesApi.support(mergeDuplicate.issue.id);
      if (mediaFile) {
        await issuesApi.addImages(mergeDuplicate.issue.id, [mediaFile]);
      }
      setCreatedIssue(mergeDuplicate.issue);
      setSubmitted(true);
      toast.info("Report merged with existing issue");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Merge failed — please try again.";
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (submitted) {
    return <SuccessScreen t={t} isDark={isDark} createdIssue={createdIssue} onBack={onBack} />;
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "transparent", fontFamily: "Inter, sans-serif" }}>
      <style>{`::-webkit-scrollbar{display:none}`}</style>

      <AnimatePresence>
        {cameraOpen && (
          <CameraCapture
            isDark={isDark}
            onCapture={(file) => handleFile(file)}
            onClose={() => setCameraOpen(false)}
            onChooseFile={() => { setCameraOpen(false); fileRef.current?.click(); }}
          />
        )}
      </AnimatePresence>

      {/* Slide container */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">

          {step === 1 && (
            <UploadLocationStep
              t={t} isDark={isDark}
              fileRef={fileRef}
              dragOver={dragOver} setDragOver={setDragOver}
              onDrop={onDrop} handleFile={handleFile}
              uploadState={uploadState} setUploadState={setUploadState}
              image={image} setImage={setImage} imageName={imageName}
              setCameraOpen={setCameraOpen}
              coords={coords}
              location={location} setLocation={setLocation}
              locating={locating} locationError={locationError}
              handleUseGps={handleUseGps} handlePickLocation={handlePickLocation}
              onBack={onBack} onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <AIAnalysisStep
              t={t} isDark={isDark}
              analyzing={analyzing} aiDone={aiDone} analyzeError={analyzeError}
              image={image} imageName={imageName} location={location}
              description={description} setDescription={setDescription}
              sevColor={sevColor} severityLabel={severityLabel}
              issueTypeLabel={issueTypeLabel} departmentLabel={departmentLabel}
              dupCount={dupCount} summaryText={summaryText}
              priorityScore={priorityScore} priorityLevel={priorityLevel} riskLabel={riskLabel}
              onBack={() => setStep(1)} onNext={() => setStep(3)}
            />
          )}

          {step === 3 && (
            <ReviewSubmitStep
              t={t} isDark={isDark}
              image={image} location={location}
              issueTypeLabel={issueTypeLabel} severityLabel={severityLabel} sevColor={sevColor}
              departmentLabel={departmentLabel} summaryText={summaryText} dupCount={dupCount}
              anonymous={anonymous} setAnonymous={setAnonymous}
              submitError={submitError} submitting={submitting} duplicateFound={duplicateFound}
              mergeDuplicate={mergeDuplicate ? { id: mergeDuplicate.issue.id, title: mergeDuplicate.issue.title, distanceMeters: mergeDuplicate.distanceMeters } : null}
              onBack={() => setStep(2)}
              onEditLocation={() => setStep(1)} onEditCategory={() => setStep(2)}
              onSubmit={() => handleSubmit(duplicateFound)}
              onMerge={handleMerge}
            />
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
