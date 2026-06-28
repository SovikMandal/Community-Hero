// Shared TypeScript types mirroring the backend data model + API envelopes.
// Kept as string-literal unions (not TS enums) to satisfy `erasableSyntaxOnly`.

// ── Enums (as unions) ────────────────────────────────────────────────────────
export type Role = "CITIZEN" | "OFFICER" | "ADMIN";

export type IssueCategory =
  | "POTHOLE"
  | "WATER_LEAKAGE"
  | "GARBAGE"
  | "STREET_LIGHT"
  | "ROAD_DAMAGE"
  | "OPEN_MANHOLE"
  | "ILLEGAL_DUMPING"
  | "FALLEN_TREE"
  | "DRAINAGE_BLOCKAGE"
  | "OTHER";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IssueStatus =
  | "REPORTED"
  | "VERIFIED"
  | "ASSIGNED"
  | "ENGINEER_VISITED"
  | "REPAIR_STARTED"
  | "COMPLETED"
  | "REJECTED";
export type VerificationAnswer = "YES" | "NO";
export type ChatRole = "USER" | "ASSISTANT";

// ── Response envelopes ───────────────────────────────────────────────────────
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination?: Pagination;
}

// ── Models ───────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  latitude?: number | null;
  longitude?: number | null;
  departmentId?: string | null;
  /** Profile photo as a data URL. Currently stored client-side only. */
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResult {
  user: User;
  token: string;
  refreshToken: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  _count?: { issues: number; users?: number };
}

/** Per-department status breakdown for the admin Departments overview cards. */
export interface DepartmentStats {
  total: number;
  reported: number;
  verified: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

/** A department enriched with its report status breakdown (GET /api/admin/departments). */
export interface DepartmentWithStats extends Department {
  stats: DepartmentStats;
}

export interface IssueImage {
  id: string;
  url: string;
  publicId?: string;
  isVideo: boolean;
}

export interface TimelineEvent {
  id: string;
  status: IssueStatus;
  note?: string | null;
  actorId?: string | null;
  createdAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  aiSummary?: string | null;
  estimatedDiameter?: string | null;
  category: IssueCategory;
  severity: Severity;
  risk: RiskLevel;
  priorityScore: number;
  priority: PriorityLevel;
  isEmergency: boolean;
  status: IssueStatus;
  latitude: number;
  longitude: number;
  address?: string | null;
  trafficLevel: number;
  peopleAffected: number;
  schoolNearby: boolean;
  hospitalNearby: boolean;
  reporterId: string;
  departmentId?: string | null;
  images?: IssueImage[];
  timeline?: TimelineEvent[];
  department?: Department | null;
  reporter?: (Pick<User, "id" | "name" | "avatar"> & { email?: string | null }) | null;
  _count?: { votes?: number; supports?: number; verifications?: number };
  citizenCount?: number;
  /** On the "mine" list: whether the user created this report or merged a duplicate into it. */
  myReportType?: "created" | "merged";
  /** Set on the detail endpoint when authenticated. */
  supportedByMe?: boolean;
  votedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** A user who contributed to a report: its creator or someone who merged into it. */
export interface IssueContributor {
  /** 1-based display index. */
  index: number;
  userId: string;
  name: string;
  email: string;
  /** "created" = filed the report; "merged" = merged a duplicate into it. */
  type: "created" | "merged";
  /** Global leaderboard rank, or null if the user isn't ranked. */
  rank: number | null;
  points: number;
}

export interface MapMarker {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: PriorityLevel;
  isEmergency: boolean;
  latitude: number;
  longitude: number;
  createdAt?: string;
  reporterId?: string | null;
  reporter?: { name: string };
  _count?: { votes: number };
}

export interface DashboardStats {
  totalComplaints: number;
  resolved: number;
  /** Count of rejected reports. */
  rejected: number;
  /** Percentage (0–100). */
  resolvedRate: number;
  avgResolutionHours: number | null;
  mostCommonIssue: IssueCategory | null;
  categoryBreakdown: { category: IssueCategory; count: number }[];
  departmentPerformance: { department: string; total: number }[];
}

export interface Hotspot {
  latitude: number;
  longitude: number;
  count: number;
  categories?: Record<string, number>;
}

// ── Admin ────────────────────────────────────────────────────────────────────
/** Response of GET /api/admin/overview. */
export interface AdminOverview {
  users: {
    total: number;
    citizens: number;
    officers: number;
    admins: number;
  };
  issues: {
    total: number;
    resolved: number;
    /** Percentage (0–100). */
    resolvedRate: number;
    /** Count keyed by lifecycle status (only present statuses are included). */
    byStatus: Partial<Record<IssueStatus, number>>;
    byPriority: Partial<Record<PriorityLevel, number>>;
  };
  departments: number;
  recentIssues: Issue[];
  recentUsers: Pick<User, "id" | "name" | "email" | "role" | "avatar" | "createdAt">[];
}

/** A single lifecycle event in the admin activity timeline (GET /api/admin/activity). */
export interface AdminActivityEvent {
  id: string;
  status: IssueStatus;
  note?: string | null;
  createdAt: string;
  issueId: string | null;
  issueTitle: string;
  /** The issue's current department (relevant for routing/assignment events). */
  department: string | null;
  /** Name of the user who triggered the event, if any. */
  actor: string | null;
}

/** A lifecycle event in the citizen's own activity timeline (GET /api/issues/my-activity). */
export interface MyActivityEvent {
  id: string;
  status: IssueStatus;
  note?: string | null;
  createdAt: string;
  issueId: string | null;
  issueTitle: string;
  department: string | null;
  /** "created" = the user filed this report; "merged" = they supported a duplicate. */
  reportType: "created" | "merged";
}

// ── Leaderboard ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string | null;
  role: Role;
  rank: number;
  points: number;
  level: number;
  badge: string;
  reports: number;
  verified: number;
  resolved: number;
  verifications: number;
  /** 0–100 score relative to the top contributor. */
  impactScore: number;
  isMe: boolean;
}

export interface LeaderboardMe extends LeaderboardEntry {
  /** Points still required to reach the next level. */
  pointsToNextLevel: number;
  /** Progress through the current level as a percentage (0–100). */
  levelProgress: number;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  me: LeaderboardMe | null;
  totalCitizens: number;
  community: { verifications: number };
}

/** AI analysis returned alongside a freshly created issue. */
export interface IssueAnalysis {
  category?: IssueCategory;
  severity?: Severity;
  risk?: RiskLevel;
  isEmergency?: boolean;
  estimatedDiameter?: string | null;
  summary?: string;
}

export interface CreateIssueResult {
  issue: Issue;
  analysis: IssueAnalysis | null;
}

/** Result of POST /api/issues/analyze (preview, nothing saved). */
export interface AnalyzeResult {
  category: IssueCategory;
  severity: Severity;
  risk: RiskLevel;
  isEmergency: boolean;
  estimatedDiameter: string | null;
  summary: string;
  priorityScore: number;
  priority: PriorityLevel;
  department: string;
  duplicates: { issue: Issue; distanceMeters: number }[];
  aiAvailable: boolean;
}

/** Payload attached to a 409 duplicate response. */
export interface DuplicateInfo {
  issue: Issue;
  distanceMeters: number;
}

export interface ChatMessage {
  id?: string;
  role: ChatRole;
  content: string;
  issueId?: string | null;
  createdAt?: string;
}

// ── Community ────────────────────────────────────────────────────────────────
export interface CommentAuthor {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface IssueComment {
  id: string;
  content: string;
  user: CommentAuthor | null;
  createdAt: string;
}

export interface CommunityImage {
  id: string;
  url: string;
  isVideo: boolean;
  /** True when the signed-in user uploaded this photo (may delete it). */
  canDelete?: boolean;
}

/** A single card in the Community verification feed (GET /api/community/reports). */
export interface CommunityReport {
  id: string;
  title: string;
  category: IssueCategory;
  status: IssueStatus;
  location: string;
  image: string | null;
  images: CommunityImage[];
  /** Derived 0–100 AI confidence heuristic (see backend community controller). */
  aiConfidence: number;
  /** Community confidence %: ((yes - no) / (yes + no)) * 100, floored at 0 (0 when no votes). */
  communityConfidence: number;
  /** Number of YES verifications. */
  verifiedCount: number;
  yes: number;
  no: number;
  /** The signed-in user's own verification answer, if any. */
  verifiedByMe: VerificationAnswer | null;
  /** True when the signed-in user filed this report (cannot verify own report). */
  isMine: boolean;
  reporterId: string;
  reporterName: string;
  commentCount: number;
  comments: IssueComment[];
  createdAt: string;
}

export interface VoiceResult {
  transcript: string;
  category?: IssueCategory;
  summary?: string;
}

export interface HealthStatus {
  status: string;
  uptime: number;
  integrations: { gemini: boolean; cloudinary: boolean };
}
