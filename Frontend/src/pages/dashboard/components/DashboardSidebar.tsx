import { useState } from "react";
import { motion } from "motion/react";
import { Shield, ChevronLeft, LogOut, Camera, Loader2 } from "lucide-react";
import type { DashboardTheme } from "../theme";
import { navItems } from "../data";
import type { User } from "../../../lib";

interface DashboardSidebarProps {
  t: DashboardTheme;
  isDark: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  mobileSidebar: boolean;
  setMobileSidebar: (v: boolean) => void;
  activeNav: string;
  setActiveNav: (v: string) => void;
  user?: User | null;
  displayName: string;
  onSignOut: () => void;
  rankInfo?: { points: number; rank: number } | null;
  onAvatarUpload?: (file: File) => Promise<void> | void;
}

// Sidebar contents, shared between the desktop rail and the mobile overlay.
export function DashboardSidebar({
  t, isDark, sidebarOpen, setSidebarOpen, mobileSidebar, setMobileSidebar,
  activeNav, setActiveNav, user, displayName, onSignOut, rankInfo, onAvatarUpload,
}: DashboardSidebarProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const canUploadAvatar = Boolean(onAvatarUpload && user);

  const handleAvatarFile = async (file: File) => {
    if (!onAvatarUpload) return;
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      await onAvatarUpload(file);
    } catch {
      setAvatarError("Upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fallbackAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop";
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "#2563EB", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}>
          <Shield className="w-5 h-5 text-white" />
        </div>
        {(sidebarOpen || mobileSidebar) && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="font-bold text-xl tracking-tight" style={{ color: t.text }}>
            Cityguardian
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-2 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label }) => {
          const isActive = activeNav === label;
          return (
            <motion.button key={label}
              onClick={() => { setActiveNav(label); setMobileSidebar(false); }}
              whileHover={{ x: isActive ? 0 : 2 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-3.5 px-4 py-3 rounded-2xl w-full text-left transition-colors cursor-pointer"
              style={{ background: isActive ? t.navActive : "transparent" }}>
              <Icon className="w-5 h-5 flex-shrink-0 transition-colors"
                style={{ color: isActive ? "#2563EB" : t.textMuted }} />
              {(sidebarOpen || mobileSidebar) && (
                <span className="text-sm font-semibold truncate transition-colors"
                  style={{ color: isActive ? "#2563EB" : t.textSub }}>
                  {label}
                </span>
              )}
              {isActive && (sidebarOpen || mobileSidebar) && (
                <motion.div layoutId="sidebar-dot"
                  className="ml-auto w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: "#2563EB" }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-5 pt-3 flex flex-col gap-1" style={{ borderTop: `1px solid ${t.divider}` }}>
        {/* Collapse (desktop only) */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors w-full cursor-pointer"
          style={{ color: t.textSub }}
          onMouseEnter={e => { e.currentTarget.style.background = t.navHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          <motion.div animate={{ rotate: sidebarOpen ? 0 : 180 }} transition={{ duration: 0.25 }}>
            <ChevronLeft className="w-5 h-5" style={{ color: t.textMuted }} />
          </motion.div>
          {sidebarOpen && <span className="text-sm font-semibold">Collapse</span>}
        </button>
        <button onClick={onSignOut}
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-colors w-full cursor-pointer"
          style={{ color: t.textSub }}
          onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2"; e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textSub; }}>
          <LogOut className="w-5 h-5 flex-shrink-0" style={{ color: t.textMuted }} />
          {(sidebarOpen || mobileSidebar) && <span className="text-sm font-semibold">Sign Out</span>}
        </button>
        {/* User row */}
        <div className="flex items-center gap-3 px-4 pt-3 mt-1" style={{ borderTop: `1px solid ${t.divider}` }}>
          {canUploadAvatar ? (
            <label
              className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 cursor-pointer group"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0" }}
              title="Change profile photo"
            >
              <img src={user?.avatar || fallbackAvatar} alt={displayName} className="w-full h-full object-cover" />
              <div
                className="absolute inset-0 flex items-center justify-center transition-opacity"
                style={{
                  background: "rgba(0,0,0,0.45)",
                  opacity: uploadingAvatar ? 1 : 0,
                }}
                onMouseEnter={(e) => { if (!uploadingAvatar) e.currentTarget.style.opacity = "1"; }}
                onMouseLeave={(e) => { if (!uploadingAvatar) e.currentTarget.style.opacity = "0"; }}
              >
                {uploadingAvatar
                  ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  : <Camera className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          ) : (
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2"
              style={{ borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0" }}>
              <img src={user?.avatar || fallbackAvatar} alt={displayName} className="w-full h-full object-cover" />
            </div>
          )}
          {(sidebarOpen || mobileSidebar) && (
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight truncate" style={{ color: t.text }}>{displayName}</p>
              {avatarError ? (
                <p className="text-xs mt-0.5 truncate" style={{ color: "#EF4444" }}>{avatarError}</p>
              ) : (
                <p className="text-xs mt-0.5 truncate" style={{ color: t.textSub }}>
                  {rankInfo
                    ? `${rankInfo.points.toLocaleString()} pts · Rank #${rankInfo.rank}`
                    : "—"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
