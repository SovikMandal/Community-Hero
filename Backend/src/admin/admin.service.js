// Admin service layer: validation + business logic for the admin module.
//
// Controllers stay thin (HTTP only); all rules live here and all data access
// is delegated to admin.repository.js.
import { z } from "zod";
import ApiError from "../utils/ApiError.js";
import * as repo from "./admin.repository.js";
import { computeRankedUsers } from "../services/leaderboard.service.js";
import { generateRejectionReason as aiGenerateRejectionReason } from "../services/ai.service.js";

const ISSUE_STATUSES = [
  "REPORTED",
  "VERIFIED",
  "ASSIGNED",
  "ENGINEER_VISITED",
  "REPAIR_STARTED",
  "COMPLETED",
  "REJECTED",
];
const ROLES = ["CITIZEN", "OFFICER", "ADMIN"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function parsePagination(query = {}) {
  const page = Math.max(parseInt(query.page || "1", 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "20", 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Best-effort audit logging. A failure here (e.g. the table not yet migrated)
 * must never break the underlying admin action, so all errors are swallowed
 * after a warning.
 */
async function recordAudit(adminId, action, entityType, entityId, summary, metadata) {
  try {
    await repo.createAuditLog({ adminId, action, entityType, entityId, summary, metadata });
  } catch (err) {
    console.warn("[admin] audit log write failed:", err.message);
  }
}

// ── Dashboard overview ───────────────────────────────────────────────────────
export async function getOverview() {
  const [byRole, byStatus, byPriority, totalDepartments, recentIssues, recentUsers] =
    await Promise.all([
      repo.countUsersByRole(),
      repo.groupIssuesByStatus(),
      repo.groupIssuesByPriority(),
      repo.countDepartments(),
      repo.findRecentIssues(5),
      repo.findRecentUsers(5),
    ]);

  const roleCounts = Object.fromEntries(byRole.map((r) => [r.role, r._count._all]));
  const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  const priorityCounts = Object.fromEntries(byPriority.map((p) => [p.priority, p._count._all]));

  const totalUsers = byRole.reduce((sum, r) => sum + r._count._all, 0);
  const totalIssues = byStatus.reduce((sum, s) => sum + s._count._all, 0);
  const resolved = statusCounts.COMPLETED ?? 0;
  const resolvedRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 1000) / 10 : 0;

  return {
    users: {
      total: totalUsers,
      citizens: roleCounts.CITIZEN ?? 0,
      officers: roleCounts.OFFICER ?? 0,
      admins: roleCounts.ADMIN ?? 0,
    },
    issues: {
      total: totalIssues,
      resolved,
      resolvedRate,
      byStatus: statusCounts,
      byPriority: priorityCounts,
    },
    departments: totalDepartments,
    recentIssues,
    recentUsers,
  };
}

// ── Activity timeline ────────────────────────────────────────────────────────
// Recent lifecycle events (reported → verified → routed → inspected →
// repair started → completed) across all reports, newest first. Paginated.
export async function getActivity(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const [events, total] = await Promise.all([
    repo.findRecentTimelineEvents({ skip, take: limit }),
    repo.countTimelineEvents(),
  ]);
  const items = events.map((e) => ({
    id: e.id,
    status: e.status,
    note: e.note ?? null,
    createdAt: e.createdAt,
    issueId: e.issue?.id ?? null,
    issueTitle: e.issue?.title ?? "Report",
    department: e.issue?.department?.name ?? null,
    actor: e.actor?.name ?? null,
  }));
  return { items, page, limit, total };
}

// ── Issues ───────────────────────────────────────────────────────────────────
const issueFilterSchema = z.object({
  status: z.enum(ISSUE_STATUSES).optional(),
  category: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  departmentId: z.string().optional(),
  q: z.string().optional(),
});

export async function listIssues(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filters = issueFilterSchema.parse({
    status: query.status ? String(query.status).toUpperCase() : undefined,
    category: query.category ? String(query.category).toUpperCase() : undefined,
    priority: query.priority ? String(query.priority).toUpperCase() : undefined,
    departmentId: query.departmentId || undefined,
    q: query.q || undefined,
  });

  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.priority) where.priority = filters.priority;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { address: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    repo.findIssues({ where, skip, take: limit }),
    repo.countIssues(where),
  ]);

  return { items, page, limit, total };
}

export async function getIssue(id) {
  const issue = await repo.findIssueById(id);
  if (!issue) throw ApiError.notFound("Issue not found");
  return issue;
}

/**
 * Returns everyone who contributed to a report:
 *  - the reporter, tagged `created`
 *  - every user who merged a duplicate into it (a Support), tagged `merged`
 * Each row is enriched with the user's global leaderboard rank + points.
 */
export async function getIssueContributors(id) {
  const issue = await repo.findIssueContributors(id);
  if (!issue) throw ApiError.notFound("Issue not found");

  // Global ranking so each contributor's rank/points are meaningful.
  const { entries } = await computeRankedUsers();
  const statsById = new Map(entries.map((e) => [e.id, { rank: e.rank, points: e.points }]));

  const toRow = (user, type) => {
    const stats = statsById.get(user.id);
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      type, // "created" | "merged"
      rank: stats?.rank ?? null,
      points: stats?.points ?? 0,
    };
  };

  const rows = [];
  const seen = new Set();

  if (issue.reporter) {
    rows.push(toRow(issue.reporter, "created"));
    seen.add(issue.reporter.id);
  }

  for (const support of issue.supports ?? []) {
    // A reporter who also supported their own issue stays the "created" row.
    if (seen.has(support.user.id)) continue;
    seen.add(support.user.id);
    rows.push(toRow(support.user, "merged"));
  }

  // 1-based display index for the table.
  return rows.map((row, idx) => ({ index: idx + 1, ...row }));
}

/**
 * Drafts an AI-generated rejection reason for a report. Used by the admin
 * reject dialog so the moderator can edit it before submitting.
 */
export async function generateRejectionReason(id) {
  const issue = await repo.findIssueById(id);
  if (!issue) throw ApiError.notFound("Issue not found");

  const reason = await aiGenerateRejectionReason({
    title: issue.title,
    description: issue.description,
    category: issue.category,
    aiSummary: issue.aiSummary,
  });
  return reason;
}

const statusSchema = z.object({
  status: z.enum(ISSUE_STATUSES),
  note: z.string().max(500).optional(),
});

export async function updateIssueStatus(id, body, actorId) {
  const { status, note } = statusSchema.parse(body ?? {});
  const existing = await repo.findIssueById(id);
  if (!existing) throw ApiError.notFound("Issue not found");

  const issue = await repo.updateIssue(id, {
    status,
    timeline: {
      create: { status, note: note || `Status changed to ${status}`, actorId },
    },
  });

  await recordAudit(
    actorId,
    "ISSUE_STATUS_UPDATED",
    "Issue",
    id,
    `Status: ${existing.status} → ${status}`,
    { from: existing.status, to: status, note: note ?? null }
  );

  return issue;
}

const assignSchema = z.object({
  departmentId: z.string().min(1, "departmentId is required"),
  note: z.string().max(500).optional(),
});

export async function assignIssue(id, body, actorId) {
  const { departmentId, note } = assignSchema.parse(body ?? {});

  const [existing, department] = await Promise.all([
    repo.findIssueById(id),
    repo.findDepartmentById(departmentId),
  ]);
  if (!existing) throw ApiError.notFound("Issue not found");
  if (!department) throw ApiError.notFound("Department not found");

  const nextStatus = existing.status === "REPORTED" ? "ASSIGNED" : existing.status;
  const issue = await repo.updateIssue(id, {
    departmentId,
    status: nextStatus,
    timeline: {
      create: {
        status: nextStatus,
        note: note || `Routed to ${department.name}`,
        actorId,
      },
    },
  });

  await recordAudit(
    actorId,
    "ISSUE_ASSIGNED",
    "Issue",
    id,
    `Assigned to ${department.name}`,
    { departmentId, departmentName: department.name }
  );

  return issue;
}

export async function deleteIssue(id, actorId) {
  const existing = await repo.findIssueById(id);
  if (!existing) throw ApiError.notFound("Issue not found");
  await repo.deleteIssue(id);
  await recordAudit(actorId, "ISSUE_DELETED", "Issue", id, `Deleted issue "${existing.title}"`, {
    title: existing.title,
    status: existing.status,
  });
  return { id };
}

// ── Departments ──────────────────────────────────────────────────────────────
export function listDepartments() {
  return repo.findDepartments();
}

/**
 * Departments enriched with a per-department status breakdown for the admin
 * Departments overview cards (total / in-progress / resolved / rejected, …).
 */
export async function listDepartmentsWithStats() {
  const [departments, grouped] = await Promise.all([
    repo.findDepartments(),
    repo.groupIssuesByDepartmentStatus(),
  ]);

  const emptyStats = () => ({
    total: 0,
    reported: 0,
    verified: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
  });

  const byDept = new Map();
  for (const g of grouped) {
    if (!g.departmentId) continue; // skip unassigned issues
    if (!byDept.has(g.departmentId)) byDept.set(g.departmentId, emptyStats());
    const s = byDept.get(g.departmentId);
    const n = g._count._all;
    s.total += n;
    switch (g.status) {
      case "REPORTED":
        s.reported += n;
        break;
      case "VERIFIED":
        s.verified += n;
        break;
      case "ASSIGNED":
      case "ENGINEER_VISITED":
      case "REPAIR_STARTED":
        s.inProgress += n;
        break;
      case "COMPLETED":
        s.resolved += n;
        break;
      case "REJECTED":
        s.rejected += n;
        break;
      default:
        break;
    }
  }

  return departments.map((d) => ({ ...d, stats: byDept.get(d.id) ?? emptyStats() }));
}

const departmentCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export async function createDepartment(body, actorId) {
  const data = departmentCreateSchema.parse(body ?? {});
  const existing = await repo.findDepartmentByName(data.name);
  if (existing) throw ApiError.conflict("A department with that name already exists");
  const department = await repo.createDepartment(data);
  await recordAudit(actorId, "DEPARTMENT_CREATED", "Department", department.id, `Created department "${department.name}"`);
  return department;
}

const departmentUpdateSchema = z
  .object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.name !== undefined || d.description !== undefined, {
    message: "Provide at least one field to update",
  });

export async function updateDepartment(id, body, actorId) {
  const data = departmentUpdateSchema.parse(body ?? {});
  const existing = await repo.findDepartmentById(id);
  if (!existing) throw ApiError.notFound("Department not found");

  if (data.name && data.name !== existing.name) {
    const clash = await repo.findDepartmentByName(data.name);
    if (clash) throw ApiError.conflict("A department with that name already exists");
  }
  const department = await repo.updateDepartment(id, data);
  await recordAudit(actorId, "DEPARTMENT_UPDATED", "Department", id, `Updated department "${department.name}"`, data);
  return department;
}

export async function deleteDepartment(id, actorId) {
  const existing = await repo.findDepartmentById(id);
  if (!existing) throw ApiError.notFound("Department not found");
  await repo.deleteDepartment(id);
  await recordAudit(actorId, "DEPARTMENT_DELETED", "Department", id, `Deleted department "${existing.name}"`);
  return { id };
}

// ── Users ────────────────────────────────────────────────────────────────────
const userFilterSchema = z.object({
  role: z.enum(ROLES).optional(),
  q: z.string().optional(),
});

export async function listUsers(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filters = userFilterSchema.parse({
    role: query.role ? String(query.role).toUpperCase() : undefined,
    q: query.q || undefined,
  });

  const where = {};
  if (filters.role) where.role = filters.role;
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    repo.findUsers({ where, skip, take: limit }),
    repo.countUsers(where),
  ]);

  return { items, page, limit, total };
}

const roleSchema = z.object({ role: z.enum(ROLES) });

export async function updateUserRole(id, body, actingUserId) {
  const { role } = roleSchema.parse(body ?? {});
  if (id === actingUserId) {
    throw ApiError.badRequest("You cannot change your own role");
  }
  const existing = await repo.findUserById(id);
  if (!existing) throw ApiError.notFound("User not found");
  const user = await repo.updateUser(id, { role });
  await recordAudit(actingUserId, "USER_ROLE_UPDATED", "User", id, `Role: ${existing.role} → ${role}`, {
    from: existing.role,
    to: role,
  });
  return user;
}

export async function deleteUser(id, actingUserId) {
  if (id === actingUserId) {
    throw ApiError.badRequest("You cannot delete your own account");
  }
  const existing = await repo.findUserById(id);
  if (!existing) throw ApiError.notFound("User not found");

  // Issue.reporter is a required relation (no cascade), so a user who has
  // reported issues cannot be removed without orphaning data.
  const reported = await repo.countIssuesByReporter(id);
  if (reported > 0) {
    throw ApiError.conflict(
      `This user has ${reported} reported issue(s) and cannot be deleted. Reassign or remove those issues first.`
    );
  }

  await repo.deleteUser(id);
  await recordAudit(actingUserId, "USER_DELETED", "User", id, `Deleted user "${existing.name}" (${existing.email})`);
  return { id };
}

// ── Audit log ────────────────────────────────────────────────────────────────
const auditFilterSchema = z.object({
  action: z.string().optional(),
  entityType: z.string().optional(),
  adminId: z.string().optional(),
});

export async function listAuditLogs(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const filters = auditFilterSchema.parse({
    action: query.action ? String(query.action).toUpperCase() : undefined,
    entityType: query.entityType || undefined,
    adminId: query.adminId || undefined,
  });

  const where = {};
  if (filters.action) where.action = filters.action;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.adminId) where.adminId = filters.adminId;

  const [items, total] = await Promise.all([
    repo.findAuditLogs({ where, skip, take: limit }),
    repo.countAuditLogs(where),
  ]);
  return { items, page, limit, total };
}

// ── Announcements ────────────────────────────────────────────────────────────
const AUDIENCES = ["ALL", "CITIZENS", "OFFICERS"];

export async function listAnnouncements(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};
  if (query.published === "true") where.published = true;
  if (query.published === "false") where.published = false;
  if (query.audience) where.audience = String(query.audience).toUpperCase();

  const [items, total] = await Promise.all([
    repo.findAnnouncements({ where, skip, take: limit }),
    repo.countAnnouncements(where),
  ]);
  return { items, page, limit, total };
}

export async function getAnnouncement(id) {
  const announcement = await repo.findAnnouncementById(id);
  if (!announcement) throw ApiError.notFound("Announcement not found");
  return announcement;
}

const announcementCreateSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(1).max(5000),
  audience: z.enum(AUDIENCES).optional(),
  published: z.boolean().optional(),
});

export async function createAnnouncement(body, authorId) {
  const data = announcementCreateSchema.parse(body ?? {});
  const announcement = await repo.createAnnouncement({ ...data, authorId });
  await recordAudit(authorId, "ANNOUNCEMENT_CREATED", "Announcement", announcement.id, `Created announcement "${announcement.title}"`);
  return announcement;
}

const announcementUpdateSchema = z
  .object({
    title: z.string().min(3).max(140).optional(),
    body: z.string().min(1).max(5000).optional(),
    audience: z.enum(AUDIENCES).optional(),
    published: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });

export async function updateAnnouncement(id, body, actorId) {
  const data = announcementUpdateSchema.parse(body ?? {});
  const existing = await repo.findAnnouncementById(id);
  if (!existing) throw ApiError.notFound("Announcement not found");
  const announcement = await repo.updateAnnouncement(id, data);
  await recordAudit(actorId, "ANNOUNCEMENT_UPDATED", "Announcement", id, `Updated announcement "${announcement.title}"`, data);
  return announcement;
}

export async function deleteAnnouncement(id, actorId) {
  const existing = await repo.findAnnouncementById(id);
  if (!existing) throw ApiError.notFound("Announcement not found");
  await repo.deleteAnnouncement(id);
  await recordAudit(actorId, "ANNOUNCEMENT_DELETED", "Announcement", id, `Deleted announcement "${existing.title}"`);
  return { id };
}

// ── System settings ──────────────────────────────────────────────────────────
export function listSettings() {
  return repo.findSettings();
}

const settingSchema = z.object({
  value: z.unknown().refine((v) => v !== undefined, { message: "value is required" }),
  description: z.string().max(300).optional(),
});

export async function upsertSetting(key, body, actorId) {
  if (!key || typeof key !== "string") throw ApiError.badRequest("A setting key is required");
  const data = settingSchema.parse(body ?? {});

  const payload = { value: data.value, updatedById: actorId };
  if (data.description !== undefined) payload.description = data.description;

  const setting = await repo.upsertSetting(key, payload);
  await recordAudit(actorId, "SETTING_UPDATED", "Setting", key, `Updated setting "${key}"`, { value: data.value });
  return setting;
}
