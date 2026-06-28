import { Images, PlayCircle, X } from "lucide-react";
import type { DashboardTheme } from "../../../../pages/dashboard/theme";
import type { Issue } from "../../../../lib";
import type { Surface } from "./reportDetail";

/** Lightbox-style popup showing every image/video attached to the report. */
export function ImagesModal({
  t,
  surface,
  issue,
  onClose,
}: {
  t: DashboardTheme;
  surface: Surface;
  issue: Issue;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl border p-4 md:p-6"
        style={{ background: surface.cardBg, borderColor: t.cardBorder, boxShadow: t.cardShadow, ...surface.blur, scrollbarWidth: "none" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-medium text-sm flex items-center gap-2" style={{ color: t.text }}>
            <Images className="w-4 h-4 text-blue-500" /> Issue images
            <span className="text-xs" style={{ color: t.textSub }}>({issue.images?.length ?? 0})</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: surface.innerBg, color: t.text }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {issue.images && issue.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {issue.images.map((media) => (
              <a
                key={media.id}
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block rounded-2xl border overflow-hidden group"
                style={{ borderColor: t.inputBorder, background: surface.innerBg }}
              >
                {media.isVideo ? (
                  <div className="relative">
                    <video src={media.url} className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.25)" }}>
                      <PlayCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                ) : (
                  <img src={media.url} alt="Issue media" className="w-full h-44 object-cover transition-transform group-hover:scale-105" />
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-sm" style={{ color: t.textSub }}>
            No images were attached to this report.
          </div>
        )}
      </div>
    </div>
  );
}
