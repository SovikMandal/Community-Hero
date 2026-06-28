// Typed endpoint wrappers for every backend feature area.
// These map 1:1 to the routes documented in Backend/DOCUMENTATION.md.

import { api } from "./api";
import type {
  AdminOverview,
  AdminActivityEvent,
  AnalyzeResult,
  ChatMessage,
  CommunityImage,
  CommunityReport,
  CreateIssueResult,
  DashboardStats,
  Department,
  DepartmentWithStats,
  Hotspot,
  Issue,
  IssueCategory,
  IssueComment,
  IssueContributor,
  IssueStatus,
  LeaderboardResult,
  MapMarker,
  MyActivityEvent,
  PaginatedResult,
  PriorityLevel,
  VerificationAnswer,
  VoiceResult,
} from "./types";

// ── Issues ───────────────────────────────────────────────────────────────────
export interface ListIssuesParams {
  page?: number;
  limit?: number;
  category?: IssueCategory;
  status?: IssueStatus;
  priority?: PriorityLevel;
  departmentId?: string;
  mine?: boolean;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address?: string;
  category?: IssueCategory;
  trafficLevel?: number;
  peopleAffected?: number;
  schoolNearby?: boolean;
  hospitalNearby?: boolean;
  forceCreate?: boolean;
  /** Up to 5 image/video files sent under the "images" field. */
  files?: File[];
}

export interface AnalyzeInput {
  description: string;
  latitude: number;
  longitude: number;
  category?: IssueCategory;
  trafficLevel?: number;
  peopleAffected?: number;
  schoolNearby?: boolean;
  hospitalNearby?: boolean;
  files?: File[];
}

export const issues = {
  list(params: ListIssuesParams = {}): Promise<PaginatedResult<Issue>> {
    const query: Record<string, string | number | boolean | undefined> = { ...params };
    return api.getRaw<Issue[]>("/issues", query).then((r) => ({
      items: r.data,
      pagination: r.pagination,
    }));
  },

  map(): Promise<MapMarker[]> {
    return api.get<{ issues: MapMarker[] }>("/issues/map").then((d) => d.issues);
  },

  /** The signed-in user's own + merged reports' lifecycle timeline (paginated). */
  myActivity(params: { page?: number; limit?: number } = {}): Promise<PaginatedResult<MyActivityEvent>> {
    const query: Record<string, number | undefined> = { ...params };
    return api.getRaw<MyActivityEvent[]>("/issues/my-activity", query).then((r) => ({
      items: r.data,
      pagination: r.pagination,
    }));
  },

  get(id: string): Promise<Issue> {
    return api.get<{ issue: Issue }>(`/issues/${id}`).then((d) => d.issue);
  },

  create(input: CreateIssueInput): Promise<CreateIssueResult> {
    const form = new FormData();
    const { files, ...fields } = input;
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      form.append(key, String(value));
    }
    for (const file of files ?? []) form.append("images", file);
    return api.postForm<CreateIssueResult>("/issues", form);
  },

  analyze(input: AnalyzeInput): Promise<AnalyzeResult> {
    const form = new FormData();
    const { files, ...fields } = input;
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined || value === null) continue;
      form.append(key, String(value));
    }
    for (const file of files ?? []) form.append("images", file);
    return api.postForm<AnalyzeResult>("/issues/analyze", form);
  },

  updateStatus(id: string, status: IssueStatus, note?: string): Promise<Issue> {
    return api.patch<{ issue: Issue }>(`/issues/${id}/status`, { status, note }).then((d) => d.issue);
  },

  vote(id: string): Promise<{ voted: boolean; votes: number }> {
    return api.post<{ voted: boolean; votes: number }>(`/issues/${id}/vote`);
  },

  support(id: string): Promise<{ count: number }> {
    return api.post<{ count: number }>(`/issues/${id}/support`);
  },

  verify(
    id: string,
    answer: VerificationAnswer,
    location: { latitude: number; longitude: number }
  ): Promise<{ yes: number; no: number; distance: number }> {
    return api.post<{ yes: number; no: number; distance: number }>(`/issues/${id}/verify`, {
      answer,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  },

  verifications(id: string): Promise<{ yes: number; no: number }> {
    return api.get<{ yes: number; no: number }>(`/issues/${id}/verifications`);
  },

  comments(id: string): Promise<IssueComment[]> {
    return api.get<{ comments: IssueComment[] }>(`/issues/${id}/comments`).then((d) => d.comments);
  },

  addComment(id: string, content: string): Promise<IssueComment> {
    return api.post<{ comment: IssueComment }>(`/issues/${id}/comments`, { content }).then((d) => d.comment);
  },

  addImages(id: string, files: File[]): Promise<CommunityImage[]> {
    const form = new FormData();
    for (const file of files) form.append("images", file);
    return api.postForm<{ images: CommunityImage[] }>(`/issues/${id}/images`, form).then((d) => d.images);
  },

  deleteImage(id: string, imageId: string): Promise<CommunityImage[]> {
    return api.del<{ images: CommunityImage[] }>(`/issues/${id}/images/${imageId}`).then((d) => d.images);
  },
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export const dashboard = {
  stats(): Promise<DashboardStats> {
    return api.get<DashboardStats>("/dashboard/stats");
  },
  hotspots(): Promise<Hotspot[]> {
    return api.get<{ hotspots: Hotspot[] }>("/dashboard/hotspots").then((d) => d.hotspots);
  },
  leaderboard(): Promise<LeaderboardResult> {
    return api.get<LeaderboardResult>("/dashboard/leaderboard");
  },
  predict(): Promise<unknown> {
    return api.get<unknown>("/dashboard/predict");
  },
};

// ── Admin ────────────────────────────────────────────────────────────────────
export interface AdminListIssuesParams {
  page?: number;
  limit?: number;
  status?: IssueStatus;
  category?: IssueCategory;
  priority?: PriorityLevel;
  departmentId?: string;
  /** Free-text search over title/address. */
  q?: string;
}

export const admin = {
  /** Aggregated stats + recent activity for the admin dashboard. */
  overview(): Promise<AdminOverview> {
    return api.get<AdminOverview>("/admin/overview");
  },

  /** Recent lifecycle events across all reports for the activity timeline. */
  activity(params: { page?: number; limit?: number } = {}): Promise<PaginatedResult<AdminActivityEvent>> {
    const query: Record<string, number | undefined> = { ...params };
    return api.getRaw<AdminActivityEvent[]>("/admin/activity", query).then((r) => ({
      items: r.data,
      pagination: r.pagination,
    }));
  },

  // ── Reports (issues) ─────────────────────────────────────────────────────
  issues: {
    list(params: AdminListIssuesParams = {}): Promise<PaginatedResult<Issue>> {
      const query: Record<string, string | number | undefined> = { ...params };
      return api.getRaw<Issue[]>("/admin/issues", query).then((r) => ({
        items: r.data,
        pagination: r.pagination,
      }));
    },
    get(id: string): Promise<Issue> {
      return api.get<{ issue: Issue }>(`/admin/issues/${id}`).then((d) => d.issue);
    },
    /** Creator + everyone who merged a duplicate, with leaderboard rank/points. */
    contributors(id: string): Promise<IssueContributor[]> {
      return api
        .get<{ contributors: IssueContributor[] }>(`/admin/issues/${id}/contributors`)
        .then((d) => d.contributors);
    },
    updateStatus(id: string, status: IssueStatus, note?: string): Promise<Issue> {
      return api
        .patch<{ issue: Issue }>(`/admin/issues/${id}/status`, { status, note })
        .then((d) => d.issue);
    },
    /** AI-drafted reason an admin can edit before rejecting a report. */
    generateRejectReason(id: string): Promise<string> {
      return api
        .post<{ reason: string }>(`/admin/issues/${id}/reject-reason`)
        .then((d) => d.reason);
    },
    assign(id: string, departmentId: string, note?: string): Promise<Issue> {
      return api
        .patch<{ issue: Issue }>(`/admin/issues/${id}/assign`, { departmentId, note })
        .then((d) => d.issue);
    },
    remove(id: string): Promise<{ id: string }> {
      return api.del<{ id: string }>(`/admin/issues/${id}`);
    },
  },

  // ── Departments ──────────────────────────────────────────────────────────
  departments: {
    /** All departments, each enriched with a report status breakdown. */
    list(): Promise<DepartmentWithStats[]> {
      return api
        .get<{ departments: DepartmentWithStats[] }>("/admin/departments")
        .then((d) => d.departments);
    },
  },
};

// ── Community ────────────────────────────────────────────────────────────────
export interface CommunityReportsParams {
  page?: number;
  limit?: number;
  /** Free-text search over title/address. */
  q?: string;
}

export const community = {
  reports(params: CommunityReportsParams = {}): Promise<PaginatedResult<CommunityReport>> {
    const query: Record<string, string | number | undefined> = { ...params };
    return api.getRaw<CommunityReport[]>("/community/reports", query).then((r) => ({
      items: r.data,
      pagination: r.pagination,
    }));
  },
};

// ── Departments ──────────────────────────────────────────────────────────────
export const departments = {
  list(): Promise<Department[]> {
    return api.get<{ departments: Department[] }>("/departments").then((d) => d.departments);
  },
};

// ── Chat (AI assistant) ──────────────────────────────────────────────────────
export const chat = {
  /** Returns the assistant's reply text. */
  send(message: string, issueId?: string): Promise<string> {
    return api.post<{ reply: string }>("/chat", { message, issueId }).then((d) => d.reply);
  },
  history(): Promise<ChatMessage[]> {
    return api.get<{ messages: ChatMessage[] }>("/chat/history").then((d) => d.messages);
  },
};

// ── Voice ────────────────────────────────────────────────────────────────────
export const voice = {
  transcribe(audio: File): Promise<VoiceResult> {
    const form = new FormData();
    form.append("audio", audio);
    return api.postForm<VoiceResult>("/voice/transcribe", form);
  },
};

// ── OTP ──────────────────────────────────────────────────────────────────────
export const otp = {
  send(email: string): Promise<void> {
    return api.post("/otp/send", { email });
  },
  verify(email: string, code: string): Promise<{ verified: boolean }> {
    return api.post<{ verified: boolean }>("/otp/verify", { email, otp: code });
  },
};
