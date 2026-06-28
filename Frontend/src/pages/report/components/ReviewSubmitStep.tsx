import { motion } from "motion/react";
import {
  MapPin, CheckCircle2, Camera, Rocket, FileText,
  Check, AlertTriangle, Tag, User, CheckSquare, ArrowLeft, Building2,
} from "lucide-react";
import type { ReportTheme } from "../theme";

interface ReviewSubmitStepProps {
  t: ReportTheme;
  isDark: boolean;
  image: string | null;
  location: string;
  issueTypeLabel: string;
  severityLabel: string;
  sevColor: string;
  departmentLabel: string;
  summaryText: string;
  dupCount: number;
  anonymous: boolean;
  setAnonymous: (updater: (a: boolean) => boolean) => void;
  submitError: string | null;
  submitting: boolean;
  duplicateFound: boolean;
  mergeDuplicate?: { id: string; title: string; distanceMeters: number } | null;
  onBack: () => void;
  onEditLocation: () => void;
  onEditCategory: () => void;
  onSubmit: () => void;
  onMerge?: () => void;
}

// Slide 3 — final review of the report and submission.
export function ReviewSubmitStep({
  t, isDark, image, location, issueTypeLabel, severityLabel, sevColor, departmentLabel,
  summaryText, dupCount, anonymous, setAnonymous, submitError, submitting, duplicateFound,
  mergeDuplicate, onBack, onEditLocation, onEditCategory, onSubmit, onMerge,
}: ReviewSubmitStepProps) {
  const summaryRows: Array<{ icon: typeof MapPin; label: string; value: string; badge?: boolean; onClick?: () => void }> = [
    { icon: MapPin, label: "Location:", value: location, onClick: onEditLocation },
    { icon: Tag, label: "Category:", value: issueTypeLabel, onClick: onEditCategory },
    { icon: AlertTriangle, label: "Priority:", value: severityLabel, badge: true },
    { icon: Building2, label: "Department:", value: departmentLabel },
    { icon: User, label: "Officer:", value: "Auto-assigned on submit" },
  ];

  return (
    <motion.div key="s3"
      initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-[800px] mx-auto w-full flex flex-col gap-6 px-5 md:px-0 pb-28 sm:pb-8 pt-2">

      {/* Heading */}
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight" style={{ color: t.text }}>Review &amp; Submit</h1>
        <p className="text-sm" style={{ color: t.textSub }}>Review your report before final submission. Everything looks great!</p>
      </div>

      {/* Review card */}
      <div className="rounded-3xl border p-6"
        style={{ background: t.card, borderColor: t.cardBorder, boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.35)" : "0 12px 40px rgba(59,130,246,0.12)" }}>
        <div className="flex flex-col gap-6">
          {/* Image + summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-6">
            <div className="relative rounded-2xl border overflow-hidden"
              style={{ background: t.lockedBg, borderColor: t.inputBorder }}>
              {image ? (
                <img src={image} alt="Evidence" className="object-cover w-full h-50" />
              ) : (
                <div className="flex items-center justify-center h-50" style={{ background: t.lockedBg, color: t.textMuted }}>
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <div className="bg-gradient-to-t from-emerald-600/90 to-transparent absolute inset-x-0 bottom-0 p-3">
                <div className="inline-flex backdrop-blur-sm font-semibold rounded-full bg-white/15 text-white text-xs px-3 py-1 items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Image Verified
                </div>
              </div>
            </div>

            <div className="rounded-2xl border flex p-5 flex-col justify-between"
              style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)", borderColor: t.inputBorder }}>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm" style={{ color: t.textSub }}>Summary</div>
                  <div className="font-semibold rounded-full text-xs px-3 py-1"
                    style={{ background: `${sevColor}1A`, color: sevColor }}>{severityLabel}</div>
                </div>
                <div className="space-y-3 text-sm">
                  {summaryRows.map(({ icon: Icon, label, value, badge, onClick }) => (
                    <div key={label} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium" style={{ color: t.text }}>{label} </span>
                        {badge ? (
                          <span className="font-semibold rounded-full px-2 py-0.5 text-xs"
                            style={{ background: `${sevColor}1A`, color: sevColor }}>{value}</span>
                        ) : (
                          <span style={{ color: t.textSub }}>{value}</span>
                        )}
                        {onClick && (
                          <button onClick={onClick} className="ml-2 text-xs font-semibold text-blue-500">Edit</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="rounded-2xl border p-5" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(244,244,245,0.4)", borderColor: t.inputBorder }}>
            <div className="font-semibold text-sm flex mb-3 items-center gap-2" style={{ color: t.text }}>
              <FileText className="w-4 h-4 text-blue-500" /> AI Summary
            </div>
            <div className="rounded-xl p-4 text-sm leading-6"
              style={{ background: t.lockedBg, color: t.textSub, borderLeft: "4px solid #2563EB" }}>
              {summaryText || "Your report will be analyzed and summarized by AI on submission, then routed to the matching department."}
            </div>
          </div>

          {/* Verification checklist */}
          <div className="rounded-2xl border p-5" style={{ background: t.card, borderColor: t.inputBorder }}>
            <div className="font-semibold text-sm flex mb-4 items-center gap-2" style={{ color: t.text }}>
              <CheckSquare className="w-4 h-4 text-blue-500" /> Verification Checklist
            </div>
            <div className="space-y-3 text-sm">
              {[
                image ? "Image Verified — AI confirmed clear, GPS-tagged photo" : "No image attached — you can still submit",
                location ? `Location Verified — ${location.slice(0, 50)}${location.length > 50 ? "…" : ""} confirmed` : "Location not set",
                dupCount > 0 ? `Duplicate Checked — ${dupCount} nearby report(s) found` : "Duplicate Checked — no nearby duplicates",
              ].map((txt) => (
                <div key={txt} className="rounded-xl flex px-4 py-3 items-start gap-3"
                  style={{ background: isDark ? "rgba(16,185,129,0.08)" : "#ECFDF5", color: isDark ? "#6EE7B7" : "#047857" }}>
                  <Check className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div className="rounded-2xl border flex p-5 justify-between items-center"
            style={{ background: t.card, borderColor: t.inputBorder }}>
            <div>
              <div className="font-semibold text-sm" style={{ color: t.text }}>Submit Anonymously</div>
              <div className="text-sm" style={{ color: t.textSub }}>Your identity will be hidden from public view.</div>
            </div>
            <button type="button" onClick={() => setAnonymous(a => !a)}
              className="rounded-full flex p-1 items-center w-12 h-7 flex-shrink-0 transition-colors"
              style={{ background: anonymous ? "#2563EB" : (isDark ? "#334155" : "#CBD5E1") }}
              aria-pressed={anonymous}>
              <motion.div layout className="w-5 h-5 rounded-full bg-white shadow"
                style={{ marginLeft: anonymous ? "auto" : 0 }} />
            </button>
          </div>
        </div>
      </div>

      {/* Merge duplicate suggestion */}
      {mergeDuplicate && onMerge && (
        <div className="rounded-2xl border p-5 flex flex-col gap-3"
          style={{ background: isDark ? "rgba(37,99,235,0.08)" : "#EFF6FF", borderColor: isDark ? "rgba(37,99,235,0.25)" : "#BFDBFE" }}>
          <div className="text-sm font-semibold" style={{ color: "#2563EB" }}>
            🔗 Similar report found ~{Math.round(mergeDuplicate.distanceMeters)}m away
          </div>
          <div className="text-sm" style={{ color: t.textSub }}>
            &ldquo;{mergeDuplicate.title}&rdquo; — You can merge your report to support this existing issue instead of creating a duplicate.
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onMerge}
            disabled={submitting}
            className="inline-flex font-semibold rounded-full text-sm px-5 py-3 items-center gap-2 text-white self-start"
            style={{ background: "#16A34A", opacity: submitting ? 0.7 : 1 }}>
            <CheckCircle2 className="w-4 h-4" /> Merge Report
          </motion.button>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="rounded-2xl px-4 py-3 text-sm font-medium"
          style={{ background: isDark ? "rgba(239,68,68,0.10)" : "#FEF2F2", color: "#DC2626", border: `1px solid ${isDark ? "rgba(239,68,68,0.25)" : "#FECACA"}` }}>
          {submitError}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center">
        <button onClick={onBack}
          className="inline-flex font-medium rounded-full text-sm px-5 py-3 items-center gap-2"
          style={{ background: "transparent", color: t.text, border: `1px solid ${t.inputBorder}` }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        {mergeDuplicate && onMerge ? (
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={submitting ? {} : { scale: 1.02, y: -2 }} whileTap={submitting ? {} : { scale: 0.97 }}
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex font-medium rounded-full text-sm px-5 py-3 items-center gap-2"
              style={{ background: "transparent", color: t.text, border: `1px solid ${t.inputBorder}`, opacity: submitting ? 0.7 : 1, cursor: submitting ? "wait" : "pointer" }}>
              <Rocket className="w-4 h-4" /> Submit Anyway
            </motion.button>
            <motion.button
              whileHover={submitting ? {} : { scale: 1.02, y: -2 }} whileTap={submitting ? {} : { scale: 0.97 }}
              onClick={onMerge}
              disabled={submitting}
              className="inline-flex font-semibold rounded-full text-sm px-5 py-3 items-center gap-2 text-white"
              style={{ background: "#16A34A", boxShadow: "0 4px 16px rgba(22,163,74,0.30)", opacity: submitting ? 0.7 : 1, cursor: submitting ? "wait" : "pointer" }}>
              <CheckCircle2 className="w-4 h-4" /> Merge Report
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileHover={submitting ? {} : { scale: 1.02, y: -2 }} whileTap={submitting ? {} : { scale: 0.97 }}
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex font-semibold rounded-full text-sm px-5 py-3 items-center gap-2 text-white"
            style={{ background: "#2563EB", boxShadow: "0 4px 16px rgba(59,130,246,0.30)", opacity: submitting ? 0.7 : 1, cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? (
              <>
                <motion.div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }} />
                Submitting…
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" /> {duplicateFound ? "Submit Anyway" : "Submit AI Report"}
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
