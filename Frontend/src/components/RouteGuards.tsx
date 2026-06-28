import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAdmin, hasRole, type Role, type User } from "../lib";

interface GuardProps {
  /** The current user, or null when signed out. */
  user: User | null;
  /** False until the initial session restore (fetchCurrentUser) has settled. */
  ready: boolean;
  children: ReactNode;
}

/** Centered spinner shown while the session is still being restored. */
function AuthLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </div>
  );
}

/**
 * Requires an authenticated user (any role). Redirects to /auth when signed
 * out. Waits for session restore so a logged-in user isn't bounced on refresh.
 */
export function RequireAuth({ user, ready, children }: GuardProps) {
  if (!ready) return <AuthLoading />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/**
 * Requires the ADMIN role. Signed-out users go to /auth; authenticated
 * non-admins are sent to the regular dashboard and can never see the admin UI.
 */
export function RequireAdmin({ user, ready, children }: GuardProps) {
  if (!ready) return <AuthLoading />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin(user)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

interface RequireRoleProps extends GuardProps {
  roles: Role[];
  /** Where to send authenticated users who lack the role. */
  fallback?: string;
}

/** Requires one of the given roles. Generic version of RequireAdmin. */
export function RequireRole({ user, ready, roles, fallback = "/dashboard", children }: RequireRoleProps) {
  if (!ready) return <AuthLoading />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasRole(user, ...roles)) return <Navigate to={fallback} replace />;
  return <>{children}</>;
}

/**
 * Citizen-area guard. An ADMIN is redirected to the admin dashboard so admins
 * and citizens never share the same UI. Guests (no user) and non-admins pass
 * through, which keeps the public "continue as guest" dashboard working.
 *
 * No loading gate here: a logged-in admin's role is already in the cached user
 * on first paint, so they're redirected immediately without flashing the
 * citizen UI; the common citizen/guest path renders with no spinner.
 */
export function BlockAdmins({ user, children }: { user: User | null; children: ReactNode }) {
  if (isAdmin(user)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
