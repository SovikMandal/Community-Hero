import {
  CheckCircle2, Clock, Activity, AlertTriangle,
  LayoutDashboard, MapPin, Map, Trophy, Users, LocateFixed
} from "lucide-react";

// Status badge styling used by the "Recent Reports" list.
export const statusMap: Record<string, { color: string; bg: string; bgDark: string; icon: typeof CheckCircle2; label: string }> = {
  Resolved:   { color: "#16A34A", bg: "#DCFCE7", bgDark: "rgba(22,163,74,0.15)",   icon: CheckCircle2,  label: "Resolved"   },
  Processing: { color: "#2563EB", bg: "#DBEAFE", bgDark: "rgba(37,99,235,0.15)",  icon: Clock,         label: "Processing" },
  Verified:   { color: "#7C3AED", bg: "#EDE9FE", bgDark: "rgba(124,58,237,0.15)", icon: Activity,      label: "Verified"   },
  Critical:   { color: "#DC2626", bg: "#FEE2E2", bgDark: "rgba(220,38,38,0.15)",  icon: AlertTriangle, label: "Critical"   },
};

export const recentReports = [
  { id: "CIV-4821", title: "Road Damage",        location: "MG Road, Sector 12",   status: "Processing", time: "2h ago",  upvotes: 34,  img: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=80&h=80&fit=crop" },
  { id: "CIV-4820", title: "Broken Streetlight", location: "Park Street, Block C", status: "Resolved",   time: "5h ago",  upvotes: 71,  img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop" },
  { id: "CIV-4819", title: "Water Leakage",      location: "Andheri West, Lane 4", status: "Critical",   time: "8h ago",  upvotes: 112, img: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=80&h=80&fit=crop" },
  { id: "CIV-4818", title: "Garbage Overflow",   location: "Karol Bagh, Market",   status: "Verified",   time: "1d ago",  upvotes: 58,  img: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807?w=80&h=80&fit=crop" },
];

export const navItems = [
  { icon: LayoutDashboard, label: "Dashboard"    },
  { icon: MapPin,          label: "Report Issue" },
  { icon: LocateFixed,     label: "Track Report" },
  { icon: Map,             label: "Explore Map"  },
  { icon: Trophy,          label: "Leaderboard"  },
  { icon: Users,           label: "Community"    },
];

export const mapPins = [
  { x: 30, y: 40, color: "#EF4444", label: "Large Pothole",      type: "Critical", id: "CIV-001" },
  { x: 55, y: 25, color: "#F59E0B", label: "Broken Streetlight", type: "High",     id: "CIV-002" },
  { x: 72, y: 55, color: "#22C55E", label: "Fixed: Garbage",     type: "Resolved", id: "CIV-003" },
  { x: 18, y: 62, color: "#2563EB", label: "Water Leakage",      type: "High",     id: "CIV-004" },
  { x: 62, y: 72, color: "#EF4444", label: "Open Manhole",       type: "Critical", id: "CIV-005" },
  { x: 42, y: 50, color: "#F59E0B", label: "Garbage Overflow",   type: "High",     id: "CIV-006" },
  { x: 82, y: 35, color: "#22C55E", label: "Fixed: Pothole",     type: "Resolved", id: "CIV-007" },
  { x: 25, y: 20, color: "#2563EB", label: "Road Damage",        type: "High",     id: "CIV-008" },
];

export const communityFeed = [
  { user: "Arjun M.",  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop", action: "reported a pothole",     location: "MG Road",      time: "2m ago",  type: "report",  color: "#EF4444" },
  { user: "Priya S.",  avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop", action: "verified water leakage", location: "Andheri West", time: "8m ago",  type: "verify",  color: "#8B5CF6" },
  { user: "Govt. PWD", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=40&h=40&fit=crop",   action: "assigned engineer",      location: "Park Street",  time: "15m ago", type: "assign",  color: "#2563EB" },
  { user: "Rahul K.",  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop", action: "reported broken light",  location: "Sector 9",     time: "22m ago", type: "report",  color: "#F59E0B" },
  { user: "Dept. MCG", avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=40&h=40&fit=crop", action: "marked as resolved",     location: "Karol Bagh",   time: "1h ago",  type: "resolve", color: "#22C55E" },
];

export const timeline = [
  { time: "10:20", label: "Road reported by citizen",    color: "#2563EB", done: true  },
  { time: "10:35", label: "AI analyzed issue",           color: "#8B5CF6", done: true  },
  { time: "10:38", label: "Duplicate detected & merged", color: "#F59E0B", done: true  },
  { time: "10:42", label: "Department assigned",         color: "#F59E0B", done: true  },
  { time: "11:15", label: "Engineer accepted task",      color: "#22C55E", done: false },
];

export const leaders = [
  { name: "Arjun Mehta",  points: 2840, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop", rank: 1, badge: "Road Warrior",    badgeColor: "#F59E0B" },
  { name: "Priya Sharma", points: 2310, avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=40&h=40&fit=crop", rank: 2, badge: "Community Hero",  badgeColor: "#94A3B8" },
  { name: "Souvik Das",   points: 1950, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop", rank: 3, badge: "Safety Champion", badgeColor: "#CD7C2F" },
];

export const rankEmojis = ["🥇", "🥈", "🥉"];
