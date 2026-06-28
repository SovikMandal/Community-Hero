import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Navbar } from "./components/Navbar";
import type { User } from "../lib";

interface AdminLayoutProps {
  /** The signed-in admin. Guaranteed ADMIN by the RequireAdmin route guard. */
  user: User | null;
  /** Clears the session and returns to the public site. */
  onLogout: () => void;
  /** Whether the dark palette is active. */
  isDark: boolean;
  /** Toggles between light and dark mode. */
  onToggleDark: () => void;
}

/**
 * Shell for every /admin route: a Sidebar + top Navbar with a scrollable
 * content area rendered via <Outlet />.
 *
 * The whole shell is wrapped in a `.dark` class when dark mode is active, so
 * every descendant that uses the design-system tokens (bg-card, text-foreground,
 * border-border, …) themes automatically.
 *
 * Authorization is handled by the RequireAdmin guard that wraps this layout in
 * the router, and again server-side on every /api/admin request.
 */
export function AdminLayout({ user, onLogout, isDark, onToggleDark }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={(isDark ? "dark " : "") + "flex h-screen overflow-hidden bg-background text-foreground"}>
      <Sidebar
        onLogout={onLogout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar
          user={user}
          onLogout={onLogout}
          isDark={isDark}
          onToggleDark={onToggleDark}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
