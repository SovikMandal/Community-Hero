import { useState } from "react";
import { Search, Bell, ChevronDown, UserCircle, LogOut, Menu, Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import type { User } from "../../lib";

interface NavbarProps {
  /** The signed-in admin. Used for the profile menu. */
  user?: User | null;
  /** Called as the search query changes. */
  onSearch?: (query: string) => void;
  /** Called when the admin chooses "Logout". Should clear the session. */
  onLogout: () => void;
  /** Number of unread notifications shown on the bell badge. */
  notificationCount?: number;
  /** Whether dark mode is active. */
  isDark?: boolean;
  /** Toggles light/dark mode. */
  onToggleDark?: () => void;
  /** Opens the mobile sidebar drawer (shown only below lg). */
  onOpenMobileSidebar?: () => void;
}

function initials(name?: string | null): string {
  if (!name) return "AD";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const iconBtn =
  "flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export function Navbar({
  user,
  onSearch,
  onLogout,
  notificationCount = 0,
  isDark = false,
  onToggleDark,
  onOpenMobileSidebar,
}: NavbarProps) {
  const [query, setQuery] = useState("");

  const handleQuery = (value: string) => {
    setQuery(value);
    onSearch?.(value);
  };

  return (
    <header className="flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 sm:gap-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2 sm:gap-3">
        {/* Hamburger (mobile only) */}
        <button
          type="button"
          aria-label="Open menu"
          onClick={onOpenMobileSidebar}
          className={iconBtn + " lg:hidden"}
        >
          <Menu className="h-4 w-4" />
        </button>

        {/* Search reports */}
        <div className="hidden w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-2.5 focus-within:border-blue-400 sm:flex">
          <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Light / dark toggle */}
        <button
          type="button"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          onClick={onToggleDark}
          className={iconBtn}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button type="button" aria-label="Notifications" className={"relative " + iconBtn}>
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Admin profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-2xl border border-border bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:bg-accent outline-none">
            <Avatar className="size-8">
              {user?.avatar && <AvatarImage src={user.avatar} alt={user?.name ?? "Admin"} />}
              <AvatarFallback className="bg-blue-600 text-xs font-semibold text-white">
                {initials(user?.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left leading-tight sm:block">
              <span className="block text-sm font-semibold text-foreground">
                {user?.name ?? "Admin"}
              </span>
              <span className="block text-xs text-muted-foreground">Administrator</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <span className="block truncate">{user?.name ?? "Admin"}</span>
              {user?.email && (
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserCircle className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
