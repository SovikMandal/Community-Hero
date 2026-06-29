import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { tk } from "./theme";
import { ReportIssuePage } from "../report/ReportIssuePage";
import { ExploreMapPage } from "../Explore Map/ExploreMapPage";
import { LeaderboardPage } from "../leaderboard/LeaderboardPage";
import { CommunityPage } from "../community/CommunityPage";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { AiChatWidget, type ChatMessage } from "./components/AiChatWidget";
import { Greeting } from "./components/Greeting";
import { TodaysMission } from "./components/TodaysMission";
import { StatCards } from "./components/StatCards";
import { IssuePipeline, type StatusCounts } from "./components/IssuePipeline";
import { LiveMapCard } from "./components/LiveMapCard";
import { RecentReports } from "./components/RecentReports";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { ActivityFeedView } from "./components/ActivityFeedView";
import { CommunityFeed } from "./components/CommunityFeed";
import { Leaderboard } from "./components/Leaderboard";
import { TrackIssueView } from "./components/TrackIssueView";
import { AllIssuesView } from "./components/AllIssuesView";
import { GridBackground } from "../../components/GridBackground";
import { DashboardSkeleton } from "../PageSkeletons";
import {
  dashboard,
  issues as issuesApi,
  chat as chatApi,
  ApiError,
  uploadAvatar,
  type User,
  type DashboardStats,
  type Issue,
  type MapMarker,
  type LeaderboardResult,
  type MyActivityEvent,
} from "../../lib";

interface DashboardPageProps {
  user?: User | null;
  onSignOut: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  userLocation?: { lat: number; lng: number } | null;
  onUserUpdate?: (user: User) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
export function DashboardPage({ user, onSignOut, isDark, onToggleDark, userLocation: userLocationProp, onUserUpdate }: DashboardPageProps) {
  const t = tk(isDark);
  // Real signed-in user, with a graceful fallback for guest/browse mode.
  const displayName = user?.name ?? "Guest";
  const firstName = displayName.split(" ")[0];

  // Request geolocation when the user reaches the dashboard.
  const [localLocation, setLocalLocation] = useState<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocalLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("[Dashboard] geolocation failed:", err.code, err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);
  const userLocation = userLocationProp ?? localLocation;
  const nav = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const activeNav = path.startsWith("/report") ? "Report Issue"
    : path.startsWith("/explore") ? "Explore Map"
    : path.startsWith("/leaderboard") ? "Leaderboard"
    : path.startsWith("/community") ? "Community"
    : path.startsWith("/track") ? "Track Report"
    : path.startsWith("/all-issues") ? "Track Report"
    : path.startsWith("/activity") ? "Activity"
    : "Dashboard";

  const setActiveNav = (v: string) => {
    if (v === "Dashboard") nav("/dashboard");
    else if (v === "Report Issue") nav("/report");
    else if (v === "Explore Map") nav("/explore");
    else if (v === "Track Report") nav("/all-issues");
    else if (v === "Leaderboard") nav("/leaderboard");
    else if (v === "Community") nav("/community");
  };

  // Upload a new profile photo to Cloudinary, persist it, and refresh the
  // user in app state so it shows immediately. Returns the updated user.
  const handleAvatarUpload = async (file: File) => {
    const updated = await uploadAvatar(file);
    onUserUpdate?.(updated);
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const trackIssueId = useMemo(() => {
    const m = path.match(/\/track\/(.+)/);
    return m ? m[1] : null;
  }, [path]);
  const [mapFilter, setMapFilter] = useState("All");
  const [activePin, setActivePin] = useState<string | null>(null);
  const [showHeat, setShowHeat] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { from: "ai", text: `Hi ${firstName}! I am Gemini Cityguardian. Ask me anything about your city reports.` }
  ]);
  const [aiTyping, setAiTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiTyping, aiOpen]);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // ── Live backend data ──────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [issueList, setIssueList] = useState<Issue[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResult | null>(null);
  const [myActivity, setMyActivity] = useState<MyActivityEvent[]>([]);

  // Real points + leaderboard rank for the sidebar profile row.
  const [rankInfo, setRankInfo] = useState<{ points: number; rank: number } | null>(null);
  useEffect(() => {
    if (!user) return;
    let active = true;
    dashboard
      .leaderboard()
      .then((res) => {
        if (active && res.me) setRankInfo({ points: res.me.points, rank: res.me.rank });
      })
      .catch(() => { /* leave as null — sidebar shows a neutral placeholder */ });
    return () => { active = false; };
  }, [user]);

  // Loads all dashboard data. Extracted so it can be re-run on demand (focus,
  // tab visibility, interval) — not just when navigating into the Dashboard.
  const loadDashboardData = useCallback(() => {
    return Promise.allSettled([
      dashboard.stats({ mine: true }),
      issuesApi.list({ limit: 8, mine: true }),
      issuesApi.map({ mine: true }),
      dashboard.leaderboard(),
      issuesApi.myActivity({ limit: 6 }),
    ]).then((results) => {
      const [s, l, m, lb, act] = results;
      if (s.status === "fulfilled") setStats(s.value);
      if (l.status === "fulfilled") setIssueList(l.value.items);
      if (m.status === "fulfilled") setMarkers(m.value);
      if (lb.status === "fulfilled") setLeaderboardData(lb.value);
      if (act.status === "fulfilled") setMyActivity(act.value.items);
      if (m.status === "rejected") console.error("[Dashboard] Map fetch failed:", m.reason);
      if (s.status === "rejected" && l.status === "rejected" && m.status === "rejected") {
        setDataError("Could not reach the backend. Is the API running on port 5000?");
      } else {
        setDataError(null);
      }
    });
  }, []);

  useEffect(() => {
    if (activeNav !== "Dashboard") return;
    let active = true;

    loadDashboardData();

    // Refetch when the user refocuses the tab/window so status changes made
    // elsewhere (e.g. an officer resolving an issue) show up here, and poll
    // lightly so the pipeline + resolved counts stay current while open.
    const refresh = () => {
      if (active && document.visibilityState === "visible") loadDashboardData();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = setInterval(refresh, 30000);

    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(interval);
    };
  }, [activeNav, loadDashboardData]);

  // Filtered markers for Google Map (raw lat/lng).
  const mapMarkers = useMemo(() => {
    return markers.filter((m) => {
      if (mapFilter === "All") return true;
      if (mapFilter === "Resolved") return m.status === "COMPLETED";
      if (mapFilter === "Critical") return m.priority === "CRITICAL";
      if (mapFilter === "High") return m.priority === "HIGH";
      return true;
    });
  }, [markers, mapFilter]);

  // Pipeline + legend counts derived from the (non-rejected) marker set.
  const statusCounts = useMemo<StatusCounts>(() => {
    const c = { reported: 0, verified: 0, assigned: 0, completed: 0, rejected: stats?.rejected ?? 0, critical: 0, high: 0 };
    for (const m of markers) {
      if (m.status === "REPORTED") c.reported++;
      else if (m.status === "VERIFIED") c.verified++;
      else if (m.status === "COMPLETED") c.completed++;
      else c.assigned++; // ASSIGNED / ENGINEER_VISITED / REPAIR_STARTED
      if (m.priority === "CRITICAL") c.critical++;
      else if (m.priority === "HIGH") c.high++;
    }
    return c;
  }, [markers, stats]);

  // ── AI chat wired to POST /api/chat (requires auth) ──────────────────────────
  const sendChat = async () => {
    const text = chatMsg.trim();
    if (!text || aiTyping) return;
    setChatHistory(h => [...h, { from: "user", text }]);
    setChatMsg("");
    setAiTyping(true);
    try {
      const reply = await chatApi.send(text);
      setChatHistory(h => [...h, { from: "ai", text: reply }]);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? "Please sign in to chat with the AI assistant."
          : err instanceof ApiError
          ? err.message
          : "Sorry, I couldn't reach the assistant right now.";
      setChatHistory(h => [...h, { from: "ai", text: msg }]);
    } finally {
      setAiTyping(false);
    }
  };

  // Load prior chat history the first time the panel opens (best-effort).
  const historyLoadedRef = useRef(false);
  useEffect(() => {
    if (!aiOpen || historyLoadedRef.current) return;
    historyLoadedRef.current = true;
    chatApi
      .history()
      .then((messages) => {
        if (messages.length === 0) return;
        setChatHistory(
          messages.map((m) => ({
            from: m.role === "USER" ? ("user" as const) : ("ai" as const),
            text: m.content,
          }))
        );
      })
      .catch(() => {
        /* not signed in or no history — keep the greeting */
      });
  }, [aiOpen]);

  const sidebarContent = (
    <DashboardSidebar
      t={t} isDark={isDark}
      sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
      mobileSidebar={mobileSidebar} setMobileSidebar={setMobileSidebar}
      activeNav={activeNav}
      setActiveNav={(v) => { setActiveNav(v); setMobileSidebar(false); }}
      user={user} displayName={displayName} onSignOut={onSignOut}
      rankInfo={rankInfo}
      onAvatarUpload={handleAvatarUpload}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ fontFamily: "Inter, sans-serif", scrollbarWidth: "none" }}>
      <style>{`::-webkit-scrollbar{display:none}.gm-style-iw-c{padding:10px !important;}.gm-style-iw-d{overflow:hidden !important;}.gm-ui-hover-effect{display:none !important;}`}</style>

      {/* Background */}
      <GridBackground isDark={isDark} />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.40)" }}
              onClick={() => setMobileSidebar(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-40 flex flex-col lg:hidden w-64"
              style={{ background: t.sidebar, borderRight: `1px solid ${t.sidebarBorder}`, boxShadow: "4px 0 24px rgba(0,0,0,0.15)" }}>
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col h-full z-20 flex-shrink-0 transition-colors duration-300"
        style={{
          width: sidebarOpen ? 240 : 72,
          transition: "width 0.25s cubic-bezier(0.16,1,0.3,1)",
          background: t.sidebar,
          borderRight: `1px solid ${t.sidebarBorder}`,
          boxShadow: isDark ? "1px 0 0 rgba(255,255,255,0.04)" : "1px 0 0 #F1F5F9",
        }}>
        {sidebarContent}
      </motion.aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 min-w-0">

        <DashboardHeader
          t={t} isDark={isDark}
          onToggleDark={onToggleDark}
          onOpenMobileSidebar={() => setMobileSidebar(true)}
          onReportIssue={() => setActiveNav("Report Issue")}
        />

        {/* Body */}
        {activeNav === "Report Issue" ? (
          <ReportIssuePage isDark={isDark} onBack={() => setActiveNav("Dashboard")} />
        ) : activeNav === "Explore Map" ? (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <ExploreMapPage userLocation={userLocation} isDark={isDark} />
          </div>
        ) : activeNav === "Leaderboard" ? (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <LeaderboardPage isDark={isDark} />
          </div>
        ) : activeNav === "Community" ? (
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
            <CommunityPage isDark={isDark} />
          </div>
        ) : activeNav === "Track Report" && trackIssueId ? (
          <TrackIssueView issueId={trackIssueId} isDark={isDark} t={t} />
        ) : activeNav === "Track Report" ? (
          <AllIssuesView isDark={isDark} t={t} onBack={() => nav("/dashboard")} onSelect={(id) => nav(`/track/${id}`)} />
        ) : activeNav === "Activity" ? (
          <ActivityFeedView t={t} isDark={isDark} onBack={() => nav("/dashboard")} onSelect={(id) => nav(`/track/${id}`)} />
        ) : !stats && !dataError ? (
        <DashboardSkeleton />
        ) : (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="p-4 md:p-6 xl:p-8">
            <div className="flex flex-col gap-5">

              <Greeting t={t} greeting={greeting} firstName={firstName} stats={stats} dataError={dataError} />

              <TodaysMission isDark={isDark} me={leaderboardData?.me} />

              <StatCards t={t} isDark={isDark} stats={stats} />

              {/* Live Issue Map + Issue Pipeline – 50/50 */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <IssuePipeline t={t} isDark={isDark} statusCounts={statusCounts} total={markers.length} />
                <LiveMapCard
                  t={t} isDark={isDark}
                  mapMarkers={mapMarkers}
                  mapFilter={mapFilter} setMapFilter={setMapFilter}
                  showHeat={showHeat} setShowHeat={setShowHeat}
                  activePin={activePin} setActivePin={setActivePin}
                  userLocation={userLocation}
                  statusCounts={statusCounts}
                />
              </div>

              <RecentReports
                t={t} isDark={isDark}
                issueList={issueList} dataError={dataError}
                onViewAll={() => setActiveNav("Track Report")}
                onSelect={(id) => nav(`/track/${id}`)}
              />

              <ActivityTimeline t={t} isDark={isDark} events={myActivity} onViewAll={() => nav("/activity")} onSelect={(id) => nav(`/track/${id}`)} />

              <CommunityFeed t={t} isDark={isDark} issues={issueList} />

              <Leaderboard t={t} isDark={isDark} data={leaderboardData} />

            </div>
          </div>
        </div>
        )}
      </div>

      {/* Floating AI Chat */}
      <AiChatWidget
        t={t} isDark={isDark}
        aiOpen={aiOpen} setAiOpen={setAiOpen}
        chatHistory={chatHistory}
        chatMsg={chatMsg} setChatMsg={setChatMsg}
        sendChat={sendChat}
        aiTyping={aiTyping}
        chatEndRef={chatEndRef}
      />
    </div>
  );
}
