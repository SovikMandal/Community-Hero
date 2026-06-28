import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Building2,
  Map,
  UserCircle,
  LogOut,
  Shield,
  X,
} from "lucide-react";

interface SidebarProps {
  /** Called when the admin clicks "Logout". Should clear the session and redirect. */
  onLogout: () => void;
  /** Whether the mobile drawer is open (ignored on lg+). */
  mobileOpen?: boolean;
  /** Closes the mobile drawer. */
  onCloseMobile?: () => void;
}

// Primary navigation links for the admin panel. Profile sits with the
// account actions near the bottom, Logout is rendered separately as a button.
const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/reports", label: "Reports", icon: FileText },
  { to: "/admin/explore", label: "Explore Map", icon: Map },
  { to: "/admin/departments", label: "Departments", icon: Building2 },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "flex items-center gap-3.5 px-4 py-3 rounded-2xl w-full text-left text-sm font-semibold transition-colors",
    isActive
      ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  ].join(" ");

// Shared sidebar body used by both the desktop rail and the mobile drawer.
function SidebarBody({ onLogout, onNavigate }: { onLogout: () => void; onNavigate?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "#2563EB", boxShadow: "0 4px 14px rgba(37,99,235,0.35)" }}
        >
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <span className="block text-lg font-bold tracking-tight text-foreground">Cityguardian</span>
          <span className="block text-xs font-medium text-muted-foreground">Admin Panel</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={linkClass} onClick={onNavigate}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Account actions */}
      <div className="flex flex-col gap-1 border-t border-sidebar-border px-3 py-4">
        <NavLink to="/admin/profile" className={linkClass} onClick={onNavigate}>
          <UserCircle className="h-5 w-5 shrink-0" />
          <span className="truncate">Profile</span>
        </NavLink>

        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="truncate">Logout</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar({ onLogout, mobileOpen = false, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarBody onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="absolute left-0 top-0 bottom-0 flex w-64 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
            <button
              onClick={onCloseMobile}
              aria-label="Close menu"
              className="absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarBody onLogout={onLogout} onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
