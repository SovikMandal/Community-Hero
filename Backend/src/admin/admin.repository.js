// Admin data-access layer ("database" layer for the admin module).
//
// Every Prisma query the admin feature needs lives here, so the service and
// controller never touch the ORM directly. This keeps the admin module
// self-contained and makes it trivial to swap or mock the data source later.
//
// It reuses the shared, connection-resilient Prisma client (config/prisma.js)
// rather than opening a second physical database — the admin panel manages the
// same data citizens create.
import prisma from "../config/prisma.js";

// Shape returned for a single issue across admin endpoints.
export const ISSUE_INCLUDE = {
  reporter: { select: { id: true, name: true, email: true, avatar: true } },
  department: { select: { id: true, name: true } },
  _count: { select: { votes: true, supports: true, verifications: true, comments: true } },
};

// Fields safe to expose for a user in the admin panel (never the password).
export const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  departmentId: true,
  department: { select: { id: true, name: true } },
  createdAt: true,
  _count: { select: { issues: true } },
};

// ── Aggregates (dashboard overview) ──────────────────────────────────────────
export function countUsersByRole() {
  return prisma.user.groupBy({ by: ["role"], _count: { _all: true } });
}

export function countDepartments() {
  return prisma.department.count();
}

export function countIssues(where = {}) {
  return prisma.issue.count({ where });
}

export function groupIssuesByStatus() {
  return prisma.issue.groupBy({ by: ["status"], _count: { _all: true } });
}

export function groupIssuesByPriority() {
  return prisma.issue.groupBy({ by: ["priority"], _count: { _all: true } });
}

// Per-department status breakdown for the admin Departments overview cards.
export function groupIssuesByDepartmentStatus() {
  return prisma.issue.groupBy({
    by: ["departmentId", "status"],
    _count: { _all: true },
  });
}

export function findRecentIssues(take = 5) {
  return prisma.issue.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: ISSUE_INCLUDE,
  });
}

export function findRecentUsers(take = 5) {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take,
    select: USER_SELECT,
  });
}

// Recent lifecycle events across ALL issues, for the admin activity timeline.
// Each event carries its issue (title + current department) and the acting user.
export function findRecentTimelineEvents({ skip = 0, take = 12 } = {}) {
  return prisma.timelineEvent.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take,
    include: {
      issue: {
        select: { id: true, title: true, department: { select: { name: true } } },
      },
      actor: { select: { id: true, name: true } },
    },
  });
}

export function countTimelineEvents() {
  return prisma.timelineEvent.count();
}

// ── Issues ───────────────────────────────────────────────────────────────────
export function findIssues({ where, skip, take }) {
  return prisma.issue.findMany({
    where,
    include: ISSUE_INCLUDE,
    orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
    skip,
    take,
  });
}

export function findIssueById(id) {
  return prisma.issue.findUnique({
    where: { id },
    include: {
      ...ISSUE_INCLUDE,
      images: true,
      timeline: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });
}

export function updateIssue(id, data) {
  return prisma.issue.update({ where: { id }, data, include: ISSUE_INCLUDE });
}

// Reporter (the "created" contributor) plus every user who merged a duplicate
// into this issue via a Support record (the "merged" contributors).
export function findIssueContributors(id) {
  return prisma.issue.findUnique({
    where: { id },
    select: {
      id: true,
      createdAt: true,
      reporter: { select: { id: true, name: true, email: true } },
      supports: {
        orderBy: { createdAt: "asc" },
        select: {
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
}

export function deleteIssue(id) {
  // Issue relations (images, votes, supports, verifications, comments,
  // timeline) cascade on delete per the Prisma schema.
  return prisma.issue.delete({ where: { id } });
}

// ── Departments ──────────────────────────────────────────────────────────────
export function findDepartments() {
  return prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { issues: true, users: true } } },
  });
}

export function findDepartmentById(id) {
  return prisma.department.findUnique({ where: { id } });
}

export function findDepartmentByName(name) {
  return prisma.department.findUnique({ where: { name } });
}

export function createDepartment(data) {
  return prisma.department.create({ data });
}

export function updateDepartment(id, data) {
  return prisma.department.update({ where: { id }, data });
}

export function deleteDepartment(id) {
  // Issue.department / User.department are optional relations, so Prisma sets
  // their departmentId to null on delete rather than blocking.
  return prisma.department.delete({ where: { id } });
}

// ── Users ────────────────────────────────────────────────────────────────────
export function findUsers({ where, skip, take }) {
  return prisma.user.findMany({
    where,
    select: USER_SELECT,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countUsers(where = {}) {
  return prisma.user.count({ where });
}

export function findUserById(id) {
  return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
}

export function updateUser(id, data) {
  return prisma.user.update({ where: { id }, data, select: USER_SELECT });
}

export function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

export function countIssuesByReporter(userId) {
  return prisma.issue.count({ where: { reporterId: userId } });
}

// ── Audit log ────────────────────────────────────────────────────────────────
const AUDIT_ADMIN_SELECT = {
  admin: { select: { id: true, name: true, email: true } },
};

export function createAuditLog(data) {
  return prisma.adminAuditLog.create({ data });
}

export function findAuditLogs({ where, skip, take }) {
  return prisma.adminAuditLog.findMany({
    where,
    include: AUDIT_ADMIN_SELECT,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countAuditLogs(where = {}) {
  return prisma.adminAuditLog.count({ where });
}

// ── Announcements ────────────────────────────────────────────────────────────
const ANNOUNCEMENT_AUTHOR_SELECT = {
  author: { select: { id: true, name: true } },
};

export function findAnnouncements({ where, skip, take }) {
  return prisma.announcement.findMany({
    where,
    include: ANNOUNCEMENT_AUTHOR_SELECT,
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });
}

export function countAnnouncements(where = {}) {
  return prisma.announcement.count({ where });
}

export function findAnnouncementById(id) {
  return prisma.announcement.findUnique({
    where: { id },
    include: ANNOUNCEMENT_AUTHOR_SELECT,
  });
}

export function createAnnouncement(data) {
  return prisma.announcement.create({ data, include: ANNOUNCEMENT_AUTHOR_SELECT });
}

export function updateAnnouncement(id, data) {
  return prisma.announcement.update({
    where: { id },
    data,
    include: ANNOUNCEMENT_AUTHOR_SELECT,
  });
}

export function deleteAnnouncement(id) {
  return prisma.announcement.delete({ where: { id } });
}

// ── System settings ──────────────────────────────────────────────────────────
export function findSettings() {
  return prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
}

export function findSettingByKey(key) {
  return prisma.systemSetting.findUnique({ where: { key } });
}

export function upsertSetting(key, data) {
  return prisma.systemSetting.upsert({
    where: { key },
    create: { key, ...data },
    update: data,
  });
}
