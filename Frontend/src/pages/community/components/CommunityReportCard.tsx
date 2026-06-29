import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import {
  MapPin, Clock, Camera, Loader2,
  CheckCircle, XCircle, User, Send, X, Images, Trash2,
  LocateFixed, AlertTriangle, Upload,
} from "lucide-react";
import type { DashboardTheme } from "../../dashboard/theme";
import { useGoogleMaps } from "../../../lib/useGoogleMaps";
import { DARK_MAP_STYLE } from "../../dashboard/components/DashboardGoogleMap";
import {
  issues as issuesApi,
  ApiError,
  timeAgo,
  categoryLabel,
  type CommunityReport,
  type IssueComment,
  type VerificationAnswer,
} from "../../../lib";

interface CommunityReportCardProps {
  t: DashboardTheme;
  isDark: boolean;
  report: CommunityReport;
  /** Called with the updated report after a verify/comment/upload action. */
  onChange: (updated: CommunityReport) => void;
}

export function CommunityReportCard({ t, isDark, report, onChange }: CommunityReportCardProps) {
  const [busy, setBusy] = useState<null | "verify" | "comment" | "upload">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments popup
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [allComments, setAllComments] = useState<IssueComment[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Photos popup
  const [photosOpen, setPhotosOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add-evidence preview popup
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success">("idle");

  // Verify popup (location-gated)
  const [verifyAnswer, setVerifyAnswer] = useState<VerificationAnswer | null>(null);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [verifyFiles, setVerifyFiles] = useState<File[] | null>(null);
  const [verifyPreviewUrl, setVerifyPreviewUrl] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const verifyFileRef = useRef<HTMLInputElement>(null);
  const verifyCaptureRef = useRef<HTMLInputElement>(null);

  // Live camera (desktop/laptop front camera via getUserMedia)
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  // Make sure the camera is released if the component unmounts.
  useEffect(() => () => stopCameraStream(), []);

  const describeError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError) {
      if (err.status === 401) return "Please sign in to do that.";
      return err.message || fallback;
    }
    return fallback;
  };

  // ── Verify (location-gated popup) ────────────────────────────────────────────
  const requestGeo = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation isn't supported on this device.");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      () => {
        setGeoError("We couldn't get your location. Please enable location access and try again.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Resolve the freshest GPS fix at submit time (Promise wrapper).
  const getFreshLocation = () =>
    new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation isn't supported on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("We couldn't get your current location. Enable location access and try again.")),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });

  const openVerify = (answer: VerificationAnswer) => {
    if (busy) return;
    if (report.isMine) {
      setActionError("You can't verify your own report.");
      return;
    }
    if (verifyPreviewUrl) URL.revokeObjectURL(verifyPreviewUrl);
    setVerifyPreviewUrl(null);
    setVerifyFiles(null);
    setVerifyError(null);
    setVerifyStatus("idle");
    setCameraOpen(false);
    setCameraError(null);
    setGeo(null);
    setGeoError(null);
    setVerifyAnswer(answer);
    requestGeo();
  };

  const closeVerify = () => {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError(null);
    if (verifyPreviewUrl) URL.revokeObjectURL(verifyPreviewUrl);
    setVerifyPreviewUrl(null);
    setVerifyFiles(null);
    setVerifyAnswer(null);
    setVerifyStatus("idle");
    setVerifyError(null);
    setGeo(null);
    setGeoError(null);
  };

  const selectVerifyFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    if (verifyPreviewUrl) URL.revokeObjectURL(verifyPreviewUrl);
    setVerifyPreviewUrl(URL.createObjectURL(arr[0]));
    setVerifyFiles(arr);
  };

  // Discard the chosen evidence photo so the user can pick/take another.
  const clearVerifyPhoto = () => {
    if (verifyPreviewUrl) URL.revokeObjectURL(verifyPreviewUrl);
    setVerifyPreviewUrl(null);
    setVerifyFiles(null);
    if (verifyFileRef.current) verifyFileRef.current.value = "";
    if (verifyCaptureRef.current) verifyCaptureRef.current.value = "";
  };

  // Open the device's camera. On mobile we trigger the native camera app via the
  // `capture` file input (verifyCaptureRef, rear-facing) — the most reliable way
  // to connect to the phone camera. On desktop we fall back to an in-app
  // getUserMedia live stream (no native capture there).
  const openCamera = async () => {
    const isMobile =
      typeof navigator !== "undefined" &&
      (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && window.matchMedia("(pointer: coarse)").matches));
    if (isMobile && verifyCaptureRef.current) {
      // Launches the phone's camera directly and returns the photo to the input.
      verifyCaptureRef.current.click();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      // Older/unsupported browsers: fall back to the capture file input.
      verifyCaptureRef.current?.click();
      return;
    }
    setCameraError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError("Couldn't access the camera. Please allow camera access and try again.");
    }
  };

  const closeCamera = () => {
    stopCameraStream();
    setCameraOpen(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || cameraError) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `evidence-${Date.now()}.jpg`, { type: "image/jpeg" });
        if (verifyPreviewUrl) URL.revokeObjectURL(verifyPreviewUrl);
        setVerifyPreviewUrl(URL.createObjectURL(file));
        setVerifyFiles([file]);
        closeCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const submitVerify = async () => {
    if (!verifyAnswer || verifyStatus !== "idle") return;
    setVerifyStatus("submitting");
    setVerifyError(null);
    try {
      // Recompute the live location at the moment of submission.
      let coords: { lat: number; lng: number };
      try {
        coords = await getFreshLocation();
        setGeo(coords);
      } catch (e) {
        setVerifyError(e instanceof Error ? e.message : "Couldn't get your current location.");
        setVerifyStatus("idle");
        return;
      }

      // Attach evidence first (optional), then verify with the fresh location.
      let nextImages = report.images;
      let nextImage = report.image;
      if (verifyFiles && verifyFiles.length > 0) {
        const images = await issuesApi.addImages(report.id, verifyFiles);
        nextImages = images;
        nextImage = images[0]?.url ?? report.image;
      }
      const { yes, no } = await issuesApi.verify(report.id, verifyAnswer, {
        latitude: coords.lat,
        longitude: coords.lng,
      });
      onChange({
        ...report,
        images: nextImages,
        image: nextImage,
        yes,
        no,
        verifiedCount: yes,
        communityConfidence:
          yes + no > 0 ? Math.max(0, Math.round(((yes - no) / (yes + no)) * 100)) : 0,
        verifiedByMe: verifyAnswer,
      });
      setVerifyStatus("success");
      setTimeout(() => closeVerify(), 1500);
    } catch (err) {
      setVerifyError(describeError(err, "Could not record your verification."));
      setVerifyStatus("idle");
    }
  };

  // ── Open the comments popup (loads the full thread) ──────────────────────────
  const openComments = async () => {
    setCommentsOpen(true);
    setActionError(null);
    setCommentsLoading(true);
    try {
      const list = await issuesApi.comments(report.id);
      setAllComments(list);
      // Keep the inline card in sync with the real total + latest comments.
      onChange({ ...report, comments: list.slice(-20), commentCount: list.length });
    } catch {
      setAllComments(report.comments); // fall back to what we already have
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => setCommentsOpen(false);

  // ── Add a comment (used inside the popup) ────────────────────────────────────
  const handleComment = async () => {
    const text = commentText.trim();
    if (!text || busy) return;
    setBusy("comment");
    setActionError(null);
    try {
      const comment = await issuesApi.addComment(report.id, text);
      const base = allComments ?? report.comments;
      const next = [...base, comment];
      setAllComments(next);
      onChange({
        ...report,
        comments: next.slice(-20),
        commentCount: (allComments ? allComments.length : report.commentCount) + 1,
      });
      setCommentText("");
    } catch (err) {
      setActionError(describeError(err, "Could not post your comment."));
    } finally {
      setBusy(null);
    }
  };

  // ── Add evidence: pick → preview → confirm upload ────────────────────────────
  // Selecting files opens the preview popup instead of uploading immediately.
  const handleSelectFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(arr[0]));
    setPendingFiles(arr);
    setUploadStatus("idle");
    setActionError(null);
  };

  const closeUpload = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFiles(null);
    setUploadStatus("idle");
  };

  const confirmUpload = async () => {
    if (!pendingFiles || uploadStatus !== "idle") return;
    setUploadStatus("uploading");
    setActionError(null);
    try {
      const images = await issuesApi.addImages(report.id, pendingFiles);
      onChange({ ...report, images, image: images[0]?.url ?? report.image });
      setUploadStatus("success");
      // Show the animated check, then auto-close after 1s.
      setTimeout(() => closeUpload(), 1000);
    } catch (err) {
      setActionError(describeError(err, "Could not upload your photo."));
      setUploadStatus("idle");
    }
  };

  // ── Delete one of my own evidence photos ─────────────────────────────────────
  const handleDeletePhoto = async (imageId: string) => {
    if (deletingId) return;
    setDeletingId(imageId);
    setActionError(null);
    try {
      const images = await issuesApi.deleteImage(report.id, imageId);
      onChange({ ...report, images, image: images[0]?.url ?? null });
      if (images.length === 0) setPhotosOpen(false);
    } catch (err) {
      setActionError(describeError(err, "Could not delete this photo."));
    } finally {
      setDeletingId(null);
    }
  };

  const verifyDisabled = busy !== null;

  // Hero shows the issuer's first photo; the rest open in the photos popup.
  const photos = report.images ?? [];

  // Show only the 3 most recent comments inline (newest first).
  const recentComments = report.comments.slice(-3).reverse();
  const hasMore = report.commentCount > recentComments.length;
  const modalComments = allComments ?? report.comments;
  // Newest comments first in the popup.
  const modalCommentsDisplay = [...modalComments].reverse();

  return (
    <div
      className="rounded-3xl border overflow-hidden"
      style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
    >
      {/* Hidden file input shared by "Upload Photo" + "Add Evidence" */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleSelectFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Hero image with overlay badges — single photo + "show all" */}
      <div className="relative w-full h-52 overflow-hidden" style={{ background: t.tagBg }}>
        {photos.length > 0 ? (
          photos[0].isVideo ? (
            <video src={photos[0].url} className="object-cover w-full h-full" muted />
          ) : (
            <img src={photos[0].url} alt={report.title} className="object-cover w-full h-full" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: t.textMuted }}>
            No photo yet
          </div>
        )}
        <div className="flex absolute left-3 top-3 gap-2">
          <span
            className="font-semibold rounded-full text-xs leading-4 px-2.5 py-1"
            style={{ background: "#2563EB", color: "#FFFFFF" }}
          >
            AI Confidence {report.aiConfidence}%
          </span>
          <span
            className="font-semibold rounded-full text-xs leading-4 px-2.5 py-1 backdrop-blur"
            style={{ background: "rgba(255,255,255,0.85)", color: "#0F172A" }}
          >
            {report.verifiedCount} citizen{report.verifiedCount === 1 ? "" : "s"} verified
          </span>
        </div>
        {photos.length > 1 && (
          <button
            onClick={() => { setActionError(null); setPhotosOpen(true); }}
            className="absolute right-3 bottom-3 rounded-full text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 transition-colors"
            style={{ background: "rgba(0,0,0,0.6)", color: "#FFFFFF" }}
          >
            <Images className="size-3.5" />
            Show all {photos.length} photos
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-4">
        {/* Title + stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-lg" style={{ color: t.text }}>
              {report.title}
            </h2>
            <div className="text-sm flex flex-wrap items-center gap-1.5" style={{ color: t.textSub }}>
              <MapPin className="size-3.5" />
              <span>{report.location}</span>
              <span className="mx-1">·</span>
              <Clock className="size-3.5" />
              <span>Reported {timeAgo(report.createdAt)}</span>
              <span className="mx-1">·</span>
              <span>{categoryLabel(report.category)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatBlock t={t} label="AI Confidence" value={`${report.aiConfidence}%`} accent />
            <div className="w-px h-8" style={{ background: t.divider }} />
            <StatBlock
              t={t}
              label="Community"
              value={`${report.communityConfidence}%`}
            />
            <div className="w-px h-8" style={{ background: t.divider }} />
            <StatBlock t={t} label="Verified" value={String(report.verifiedCount)} />
          </div>
        </div>

        {report.isMine && (
          <p className="text-xs" style={{ color: t.textMuted }}>
            This is your report — you can add evidence and reply, but not verify it.
          </p>
        )}
        {actionError && !commentsOpen && (
          <p className="text-xs" style={{ color: "#EF4444" }}>
            {actionError}
          </p>
        )}

        {/* Verification options */}
        <div
          className="rounded-2xl border p-4"
          style={{ background: t.tagBg, borderColor: t.cardBorder }}
        >
          <p
            className="font-semibold uppercase text-xs leading-4 tracking-wide mb-3"
            style={{ color: t.textSub }}
          >
            Verification Options
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <OptionButton
              t={t} isDark={isDark} label="I Confirm" icon={CheckCircle} color="#2563EB"
              active={report.verifiedByMe === "YES"}
              disabled={verifyDisabled || report.isMine}
              onClick={() => openVerify("YES")}
            />
            <OptionButton
              t={t} isDark={isDark} label="Not Found" icon={XCircle} color="#EF4444"
              active={report.verifiedByMe === "NO"}
              disabled={verifyDisabled || report.isMine}
              onClick={() => openVerify("NO")}
            />
            {/* Add Evidence is hidden on mobile; available from md up. */}
            <div className="hidden md:block">
              <OptionButton
                t={t} isDark={isDark} label="Add Evidence" icon={Camera} color="#2563EB"
                active={false}
                disabled={verifyDisabled}
                onClick={() => fileInputRef.current?.click()}
              />
            </div>
          </div>
        </div>

        {/* Comments — recent 3 inline */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p
              className="font-semibold uppercase text-xs leading-4 tracking-wide"
              style={{ color: t.textSub }}
            >
              Comments {report.commentCount > 0 && `(${report.commentCount})`}
            </p>
            <button
              onClick={openComments}
              className="text-xs font-medium transition-colors"
              style={{ color: "#2563EB" }}
            >
              {report.commentCount > 0 ? "View all" : "Add comment"}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {recentComments.length === 0 ? (
              <p className="text-xs" style={{ color: t.textMuted }}>
                Be the first to comment.
              </p>
            ) : (
              recentComments.map((c) => <CommentRow key={c.id} t={t} isDark={isDark} c={c} />)
            )}
          </div>

          {hasMore && (
            <button
              onClick={openComments}
              className="self-start text-xs font-medium rounded-lg border px-3 py-1.5 transition-colors"
              style={{ background: t.card, borderColor: t.inputBorder, color: "#2563EB" }}
            >
              View all {report.commentCount} comments →
            </button>
          )}
        </div>
      </div>

      {/* Comments popup */}
      {commentsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={closeComments}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border flex flex-col overflow-hidden"
            style={{
              background: t.card,
              borderColor: t.cardBorder,
              boxShadow: t.cardShadow,
              maxHeight: "80vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: t.divider }}
            >
              <div className="flex flex-col">
                <span className="font-bold text-base" style={{ color: t.text }}>
                  Comments
                </span>
                <span className="text-xs truncate" style={{ color: t.textSub }}>
                  {report.title}
                </span>
              </div>
              <button
                onClick={closeComments}
                className="rounded-full p-1.5 transition-colors"
                style={{ color: t.textSub }}
                aria-label="Close comments"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Body — full thread (≈6 comments visible, then scrolls; newest first) */}
            <div
              className="overflow-y-auto px-5 py-4 flex flex-col gap-3"
              style={{ scrollbarWidth: "none", maxHeight: "25rem" }}
            >
              {commentsLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm" style={{ color: t.textSub }}>
                  <Loader2 className="size-4 animate-spin" />
                  Loading comments…
                </div>
              ) : modalComments.length === 0 ? (
                <p className="text-sm py-6 text-center" style={{ color: t.textMuted }}>
                  No comments yet. Start the conversation below.
                </p>
              ) : (
                modalCommentsDisplay.map((c) => <CommentRow key={c.id} t={t} isDark={isDark} c={c} />)
              )}
            </div>

            {/* Footer — add new comment */}
            <div className="px-5 py-4 border-t flex flex-col gap-2" style={{ borderColor: t.divider }}>
              {actionError && (
                <p className="text-xs" style={{ color: "#EF4444" }}>
                  {actionError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full flex justify-center items-center w-8 h-8 shrink-0"
                  style={{ background: t.tagBg }}
                >
                  <User className="size-4" style={{ color: t.textMuted }} />
                </div>
                <input
                  autoFocus
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleComment();
                  }}
                  placeholder="Add a comment..."
                  maxLength={500}
                  disabled={busy === "comment"}
                  className="rounded-xl border text-sm leading-5 outline-none px-3 py-2.5 flex-1 transition-colors disabled:opacity-60"
                  style={{ background: t.inputBg, borderColor: t.inputBorder, color: t.text }}
                />
                <button
                  onClick={handleComment}
                  disabled={busy !== null || commentText.trim().length === 0}
                  className="rounded-xl flex items-center justify-center w-10 h-10 shrink-0 transition-colors disabled:opacity-50"
                  style={{ background: "#2563EB", color: "#FFFFFF" }}
                  aria-label="Send comment"
                >
                  {busy === "comment" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photos popup — all evidence photos */}
      {photosOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setPhotosOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border flex flex-col overflow-hidden"
            style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow, maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: t.divider }}
            >
              <div className="flex flex-col">
                <span className="font-bold text-base" style={{ color: t.text }}>
                  Photos ({photos.length})
                </span>
                <span className="text-xs truncate" style={{ color: t.textSub }}>
                  {report.title}
                </span>
              </div>
              <button
                onClick={() => setPhotosOpen(false)}
                className="rounded-full p-1.5 transition-colors"
                style={{ color: t.textSub }}
                aria-label="Close photos"
              >
                <X className="size-4" />
              </button>
            </div>
            <div
              className="overflow-y-auto px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2"
              style={{ scrollbarWidth: "none", maxHeight: "70vh" }}
            >
              {photos.map((img) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden">
                  {img.isVideo ? (
                    <video src={img.url} className="object-cover w-full h-32" controls />
                  ) : (
                    <img src={img.url} alt={report.title} className="object-cover w-full h-32" />
                  )}
                  {img.canDelete && (
                    <button
                      onClick={() => handleDeletePhoto(img.id)}
                      disabled={deletingId !== null}
                      className="absolute right-1.5 top-1.5 rounded-full p-1.5 transition-colors disabled:opacity-60"
                      style={{ background: "rgba(0,0,0,0.6)", color: "#FFFFFF" }}
                      aria-label="Delete photo"
                      title="Delete your photo"
                    >
                      {deletingId === img.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {actionError && (
              <p className="text-xs px-5 pb-4" style={{ color: "#EF4444" }}>
                {actionError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add-evidence preview popup */}
      {pendingFiles && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={uploadStatus === "idle" ? closeUpload : undefined}
        >
          <style>{`@keyframes evCheckPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
          <div
            className="w-full max-w-sm rounded-3xl border flex flex-col overflow-hidden"
            style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: t.divider }}
            >
              <span className="font-bold text-base" style={{ color: t.text }}>
                Add Evidence
              </span>
              {uploadStatus === "idle" && (
                <button
                  onClick={closeUpload}
                  className="rounded-full p-1.5 transition-colors"
                  style={{ color: t.textSub }}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Square preview / success area */}
              <div
                className="relative w-full aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
                style={{ background: t.tagBg }}
              >
                {uploadStatus === "success" ? (
                  <div
                    className="flex flex-col items-center gap-2"
                    style={{ animation: "evCheckPop 0.45s cubic-bezier(0.16,1,0.3,1)" }}
                  >
                    <CheckCircle className="size-20" style={{ color: "#22C55E" }} />
                    <span className="text-sm font-semibold" style={{ color: t.text }}>
                      Uploaded
                    </span>
                  </div>
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Selected evidence" className="object-cover w-full h-full" />
                ) : null}

                {uploadStatus === "uploading" && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    <Loader2 className="size-8 animate-spin text-white" />
                  </div>
                )}

                {pendingFiles.length > 1 && uploadStatus !== "success" && (
                  <span
                    className="absolute right-2 bottom-2 rounded-full text-xs font-semibold px-2 py-0.5"
                    style={{ background: "rgba(0,0,0,0.6)", color: "#FFFFFF" }}
                  >
                    +{pendingFiles.length - 1} more
                  </span>
                )}
              </div>

              {actionError && (
                <p className="text-xs" style={{ color: "#EF4444" }}>
                  {actionError}
                </p>
              )}

              {uploadStatus !== "success" && (
                <div className="flex gap-3">
                  <button
                    onClick={closeUpload}
                    disabled={uploadStatus === "uploading"}
                    className="flex-1 font-medium rounded-xl border text-sm px-4 py-2.5 transition-colors disabled:opacity-50"
                    style={{ background: t.card, borderColor: t.inputBorder, color: t.text }}
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmUpload}
                    disabled={uploadStatus === "uploading"}
                    className="flex-1 font-medium rounded-xl text-sm px-4 py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    style={{ background: "#2563EB", color: "#FFFFFF" }}
                  >
                    {uploadStatus === "uploading" ? <Loader2 className="size-4 animate-spin" /> : null}
                    Upload
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verify popup (location-gated) */}
      {verifyAnswer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={verifyStatus === "idle" ? closeVerify : undefined}
        >
          <style>{`@keyframes evCheckPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
          <div
            className="w-full max-w-md rounded-3xl border flex flex-col overflow-hidden"
            style={{ background: t.card, borderColor: t.cardBorder, boxShadow: t.cardShadow, maxHeight: "90vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={verifyFileRef}
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                selectVerifyFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <input
              ref={verifyCaptureRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                selectVerifyFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: t.divider }}>
              <div className="flex flex-col">
                <span className="font-bold text-base" style={{ color: t.text }}>
                  {verifyAnswer === "YES" ? "Confirm this issue" : "Mark as not found"}
                </span>
                <span className="text-xs truncate" style={{ color: t.textSub }}>
                  {report.title}
                </span>
              </div>
              {verifyStatus === "idle" && (
                <button
                  onClick={closeVerify}
                  className="rounded-full p-1.5 transition-colors"
                  style={{ color: t.textSub }}
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {verifyStatus === "success" ? (
              <div
                className="p-8 flex flex-col items-center justify-center gap-3"
                style={{ animation: "evCheckPop 0.45s cubic-bezier(0.16,1,0.3,1)" }}
              >
                <CheckCircle className="size-20" style={{ color: "#22C55E" }} />
                <span className="text-base font-semibold" style={{ color: t.text }}>
                  Submitted &amp; Verified
                </span>
                <span className="text-xs text-center" style={{ color: t.textSub }}>
                  Thanks for confirming on-site.
                </span>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                {/* Live location map (non-editable) */}
                <div className="flex flex-col gap-2">
                  <div
                    className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5"
                    style={{ color: t.textSub }}
                  >
                    <LocateFixed className="size-3.5" /> Your current location
                  </div>
                  <div
                    className="relative w-full h-44 rounded-2xl overflow-hidden border"
                    style={{ borderColor: t.inputBorder, background: t.tagBg }}
                  >
                    {geoLoading ? (
                      <div className="w-full h-full flex items-center justify-center gap-2 text-sm" style={{ color: t.textSub }}>
                        <Loader2 className="size-4 animate-spin" /> Getting your location…
                      </div>
                    ) : geo ? (
                      <VerifyLocationMap lat={geo.lat} lng={geo.lng} isDark={isDark} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center text-sm px-4" style={{ color: t.textSub }}>
                        <AlertTriangle className="size-5" style={{ color: "#F59E0B" }} />
                        {geoError ?? "Location unavailable."}
                        <button onClick={requestGeo} className="text-xs font-semibold" style={{ color: "#2563EB" }}>
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                  {geo && (
                    <p className="text-xs" style={{ color: t.textMuted }}>
                      {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} · live location, can&apos;t be changed.
                    </p>
                  )}
                </div>

                {/* Evidence (optional) — upload from device or capture from camera */}
                <div className="flex flex-col gap-2">
                    <div
                      className="relative w-full h-28 rounded-2xl border overflow-hidden flex items-center justify-center"
                      style={{ background: t.tagBg, borderColor: t.inputBorder, color: t.textSub }}
                    >
                      {verifyPreviewUrl ? (
                        <>
                          <img src={verifyPreviewUrl} alt="Evidence" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={clearVerifyPhoto}
                            disabled={verifyStatus === "submitting"}
                            aria-label="Remove photo"
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md transition-colors disabled:opacity-50"
                            style={{ background: "rgba(0,0,0,0.6)" }}
                          >
                            <X className="size-4" />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <Camera className="size-6" />
                          <span className="text-xs font-medium">Add evidence photo (optional)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyFileRef.current?.click()}
                        disabled={verifyStatus === "submitting"}
                        className="flex-1 text-sm font-medium rounded-xl border px-3 py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        style={{ background: t.card, borderColor: t.inputBorder, color: t.text }}
                      >
                        <Upload className="size-4" /> Upload Photo
                      </button>
                      <button
                        onClick={openCamera}
                        disabled={verifyStatus === "submitting"}
                        className="flex-1 text-sm font-medium rounded-xl border px-3 py-2 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        style={{ background: t.card, borderColor: t.inputBorder, color: t.text }}
                      >
                        <Camera className="size-4" /> Click Photo
                      </button>
                    </div>
                  </div>

                {/* Full-screen camera capture overlay (in-app stream, desktop). */}
                {cameraOpen && createPortal(
                  <div className="fixed inset-0 z-[5000] flex flex-col bg-black">
                    {cameraError ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white">
                        <AlertTriangle className="size-6" style={{ color: "#F59E0B" }} />
                        {cameraError}
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="flex-1 h-full w-full object-contain"
                        style={{ transform: "scaleX(-1)" }}
                      />
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 p-6"
                      style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
                    >
                      <button
                        onClick={closeCamera}
                        className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={capturePhoto}
                        disabled={!!cameraError}
                        className="flex items-center justify-center gap-2 rounded-full px-8 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ background: "#2563EB" }}
                      >
                        <Camera className="size-4" /> Capture
                      </button>
                    </div>
                  </div>,
                  document.body
                )}

                {verifyError && (
                  <div
                    className="rounded-xl border px-3 py-2 text-xs flex items-start gap-2"
                    style={{
                      background: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2",
                      borderColor: "rgba(239,68,68,0.4)",
                      color: "#EF4444",
                    }}
                  >
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={closeVerify}
                    disabled={verifyStatus === "submitting"}
                    className="flex-1 font-medium rounded-xl border text-sm px-4 py-2.5 transition-colors disabled:opacity-50"
                    style={{ background: t.card, borderColor: t.inputBorder, color: t.text }}
                  >
                    Back
                  </button>
                  <button
                    onClick={submitVerify}
                    disabled={verifyStatus === "submitting"}
                    className="flex-1 font-medium rounded-xl text-sm px-4 py-2.5 flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    style={{ background: verifyAnswer === "YES" ? "#2563EB" : "#EF4444", color: "#FFFFFF" }}
                  >
                    {verifyStatus === "submitting" ? <Loader2 className="size-4 animate-spin" /> : null}
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentRow({ t, isDark, c }: { t: DashboardTheme; isDark: boolean; c: IssueComment }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="font-bold rounded-full text-xs flex justify-center items-center w-7 h-7 shrink-0 overflow-hidden"
        style={{ background: isDark ? "rgba(37,99,235,0.22)" : "rgba(37,99,235,0.12)", color: "#2563EB" }}
      >
        {c.user?.avatar ? (
          <img src={c.user.avatar} alt={c.user.name} className="w-full h-full object-cover" />
        ) : (
          (c.user?.name ?? "?").charAt(0).toUpperCase()
        )}
      </div>
      <div className="rounded-xl px-3 py-2 flex-1" style={{ background: t.tagBg }}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-xs leading-4" style={{ color: t.text }}>
            {c.user?.name ?? "Anonymous"}
          </p>
          <span className="text-xs" style={{ color: t.textMuted }}>
            {timeAgo(c.createdAt)}
          </span>
        </div>
        <p className="text-xs leading-4 mt-0.5" style={{ color: t.textSub }}>
          {c.content}
        </p>
      </div>
    </div>
  );
}

function StatBlock({
  t,
  label,
  value,
  accent,
}: {
  t: DashboardTheme;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className="text-xs leading-4" style={{ color: t.textSub }}>
        {label}
      </span>
      <span className="font-bold text-lg leading-7" style={{ color: accent ? "#2563EB" : t.text }}>
        {value}
      </span>
    </div>
  );
}

function OptionButton({
  t,
  isDark,
  label,
  icon: Icon,
  color,
  active,
  disabled,
  onClick,
}: {
  t: DashboardTheme;
  isDark: boolean;
  label: string;
  icon: typeof CheckCircle;
  color: string;
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full font-medium rounded-xl border text-xs leading-4 flex px-3 py-2 justify-center items-center gap-2 transition-colors disabled:opacity-50"
      style={{
        background: active ? (isDark ? "rgba(37,99,235,0.18)" : "#EFF6FF") : t.card,
        borderColor: active ? "#2563EB" : t.inputBorder,
        color: t.text,
      }}
    >
      <Icon className="size-3.5" style={{ color }} />
      {label}
    </button>
  );
}

// Non-interactive map showing the verifier's live location (cannot be moved).
function VerifyLocationMap({ lat, lng, isDark }: { lat: number; lng: number; isDark?: boolean }) {
  const { isLoaded, loadError } = useGoogleMaps();
  const center = useMemo(() => ({ lat, lng }), [lat, lng]);
  const options = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      gestureHandling: "none",
      keyboardShortcuts: false,
      draggable: false,
      clickableIcons: false,
      styles: isDark ? DARK_MAP_STYLE : undefined,
    }),
    [isDark]
  );

  const fallback = (text: string) => (
    <div
      className="w-full h-full flex items-center justify-center text-center text-xs px-4"
      style={{ background: isDark ? "#0b1120" : "#E8F0FE", color: isDark ? "#94a3b8" : "#475569" }}
    >
      {text}
    </div>
  );

  if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
    return fallback("Map unavailable (no API key) — your coordinates are shown below.");
  if (loadError) return fallback("Failed to load the map.");
  if (!isLoaded) return fallback("Loading map…");

  return (
    <GoogleMap mapContainerStyle={{ width: "100%", height: "100%" }} center={center} zoom={16} options={options}>
      <MarkerF position={center} />
    </GoogleMap>
  );
}
