import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { LandingPage } from "./pages/landing/LandingPage";
import { AuthPage } from "./pages/auth/AuthPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { AdminLayout } from "./admin/AdminLayout";
import { AdminDashboard } from "./admin/pages/dashboard/AdminDashboard";
import { AdminReports } from "./admin/pages/reports/AdminReports";
import { AdminReportDetail } from "./admin/pages/reports/AdminReportDetail";
import { AdminExploreMapPage } from "./admin/pages/explore/AdminExploreMapPage";
import { RequireAdmin, BlockAdmins } from "./components/RouteGuards";
import {
  fetchCurrentUser,
  getCachedUser,
  login,
  logout,
  register,
  ApiError,
  isAdmin,
  type RegisterInput,
  type User,
} from "./lib";

export default function App() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  // False until the initial session restore settles, so route guards don't
  // misfire (e.g. bounce a logged-in admin) before the user is known.
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    // Public routes that must remain accessible while logged out (e.g. the
    // password reset link arrives via email when the user has no session).
    const publicPaths = ["/reset-password"];
    const onPublicPath = publicPaths.some((p) => window.location.pathname.startsWith(p));
    fetchCurrentUser()
      .then((fresh) => {
        if (!active) return;
        if (fresh) setUser(fresh);
        else { setUser(null); if (!onPublicPath) navigate("/", { replace: true }); }
      })
      .catch(() => {
        if (active) { setUser(null); if (!onPublicPath) navigate("/", { replace: true }); }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, []);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const timer = setTimeout(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("[App] geolocation failed:", err.code, err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (email: string, password: string, asAdmin = false) => {
    const loggedIn = await login({ email, password });
    // The admin area requires a real ADMIN role issued by the backend. A normal
    // user who tries the Admin tab is rejected and their session cleared, so a
    // non-admin can never reach the admin panel or dashboard.
    if (asAdmin && loggedIn.role !== "ADMIN") {
      logout();
      setUser(null);
      throw new ApiError("This account doesn't have admin access.", 403);
    }
    setUser(loggedIn);
    navigate(loggedIn.role === "ADMIN" ? "/admin" : "/dashboard", { replace: true });
  };

  const handleRegister = async (input: RegisterInput) => {
    setUser(await register(input));
    navigate("/dashboard", { replace: true });
  };

  const handleGuest = () => {
    logout();
    setUser(null);
    navigate("/dashboard", { replace: true });
  };

  const handleSignOut = () => {
    logout();
    setUser(null);
    navigate("/", { replace: true });
  };

  const dashboard = (
    <BlockAdmins user={user}>
      <div style={{ height: "100vh" }}>
        <DashboardPage
          user={user}
          onSignOut={handleSignOut}
          isDark={isDark}
          onToggleDark={() => setIsDark(d => !d)}
          userLocation={userLocation}
          onUserUpdate={setUser}
        />
      </div>
    </BlockAdmins>
  );

  return (
    <Routes>
      <Route path="/" element={<LandingPage onAuthClick={() => navigate("/auth")} isDark={isDark} onToggleDark={() => setIsDark(d => !d)} />} />
      <Route path="/auth" element={
        <AuthPage
          isDark={isDark}
          onBack={() => navigate("/")}
          onEnter={() => navigate(getCachedUser()?.role === "ADMIN" ? "/admin" : "/dashboard")}
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGuest={handleGuest}
        />
      } />
      <Route path="/reset-password" element={<ResetPasswordPage isDark={isDark} />} />
      <Route path="/dashboard" element={dashboard} />
      <Route path="/report" element={dashboard} />
      <Route path="/explore" element={dashboard} />
      <Route path="/leaderboard" element={dashboard} />
      <Route path="/community" element={dashboard} />
      <Route path="/all-issues" element={dashboard} />
      <Route path="/track/:issueId" element={dashboard} />
      <Route path="/admin" element={
        <RequireAdmin user={user} ready={authReady}>
          <AdminLayout user={user} onLogout={handleSignOut} isDark={isDark} onToggleDark={() => setIsDark(d => !d)} />
        </RequireAdmin>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="reports/:id" element={<AdminReportDetail isDark={isDark} />} />
        <Route path="explore" element={<AdminExploreMapPage userLocation={userLocation} isDark={isDark} />} />
      </Route>
      <Route path="*" element={<Navigate to={getCachedUser() ? (isAdmin(getCachedUser()) ? "/admin" : "/dashboard") : "/"} replace />} />
    </Routes>
  );
}
