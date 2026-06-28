// Admin controller: thin HTTP handlers that delegate to admin.service.js.
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendCreated, sendPaginated } from "../utils/response.js";
import * as adminService from "./admin.service.js";

// GET /api/admin/overview
export const getOverview = asyncHandler(async (_req, res) => {
  const data = await adminService.getOverview();
  return sendSuccess(res, data, "Admin overview");
});

// GET /api/admin/activity
export const getActivity = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.getActivity(req.query);
  return sendPaginated(res, items, { page, limit, total }, "Activity timeline");
});

// ── Issues ───────────────────────────────────────────────────────────────────
// GET /api/admin/issues
export const listIssues = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.listIssues(req.query);
  return sendPaginated(res, items, { page, limit, total }, "Issues");
});

// GET /api/admin/issues/:id
export const getIssue = asyncHandler(async (req, res) => {
  const issue = await adminService.getIssue(req.params.id);
  return sendSuccess(res, { issue }, "Issue detail");
});

// GET /api/admin/issues/:id/contributors
export const getIssueContributors = asyncHandler(async (req, res) => {
  const contributors = await adminService.getIssueContributors(req.params.id);
  return sendSuccess(res, { contributors }, "Issue contributors");
});

// POST /api/admin/issues/:id/reject-reason  → AI-drafted rejection reason
export const generateRejectReason = asyncHandler(async (req, res) => {
  const reason = await adminService.generateRejectionReason(req.params.id);
  return sendSuccess(res, { reason }, "Rejection reason generated");
});

// PATCH /api/admin/issues/:id/status
export const updateIssueStatus = asyncHandler(async (req, res) => {
  const issue = await adminService.updateIssueStatus(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { issue }, "Status updated");
});

// PATCH /api/admin/issues/:id/assign
export const assignIssue = asyncHandler(async (req, res) => {
  const issue = await adminService.assignIssue(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { issue }, "Issue assigned");
});

// DELETE /api/admin/issues/:id
export const deleteIssue = asyncHandler(async (req, res) => {
  const result = await adminService.deleteIssue(req.params.id, req.user.id);
  return sendSuccess(res, result, "Issue deleted");
});

// ── Departments ──────────────────────────────────────────────────────────────
// GET /api/admin/departments
export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await adminService.listDepartmentsWithStats();
  return sendSuccess(res, { departments }, "Departments");
});

// POST /api/admin/departments
export const createDepartment = asyncHandler(async (req, res) => {
  const department = await adminService.createDepartment(req.body, req.user.id);
  return sendCreated(res, { department }, "Department created");
});

// PATCH /api/admin/departments/:id
export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await adminService.updateDepartment(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { department }, "Department updated");
});

// DELETE /api/admin/departments/:id
export const deleteDepartment = asyncHandler(async (req, res) => {
  const result = await adminService.deleteDepartment(req.params.id, req.user.id);
  return sendSuccess(res, result, "Department deleted");
});

// ── Users ────────────────────────────────────────────────────────────────────
// GET /api/admin/users
export const listUsers = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.listUsers(req.query);
  return sendPaginated(res, items, { page, limit, total }, "Users");
});

// PATCH /api/admin/users/:id/role
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { user }, "User role updated");
});

// DELETE /api/admin/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id, req.user.id);
  return sendSuccess(res, result, "User deleted");
});

// ── Audit log ────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
export const listAuditLogs = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.listAuditLogs(req.query);
  return sendPaginated(res, items, { page, limit, total }, "Audit logs");
});

// ── Announcements ────────────────────────────────────────────────────────────
// GET /api/admin/announcements
export const listAnnouncements = asyncHandler(async (req, res) => {
  const { items, page, limit, total } = await adminService.listAnnouncements(req.query);
  return sendPaginated(res, items, { page, limit, total }, "Announcements");
});

// GET /api/admin/announcements/:id
export const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await adminService.getAnnouncement(req.params.id);
  return sendSuccess(res, { announcement }, "Announcement detail");
});

// POST /api/admin/announcements
export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await adminService.createAnnouncement(req.body, req.user.id);
  return sendCreated(res, { announcement }, "Announcement created");
});

// PATCH /api/admin/announcements/:id
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await adminService.updateAnnouncement(req.params.id, req.body, req.user.id);
  return sendSuccess(res, { announcement }, "Announcement updated");
});

// DELETE /api/admin/announcements/:id
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const result = await adminService.deleteAnnouncement(req.params.id, req.user.id);
  return sendSuccess(res, result, "Announcement deleted");
});

// ── System settings ──────────────────────────────────────────────────────────
// GET /api/admin/settings
export const listSettings = asyncHandler(async (_req, res) => {
  const settings = await adminService.listSettings();
  return sendSuccess(res, { settings }, "Settings");
});

// PUT /api/admin/settings/:key
export const upsertSetting = asyncHandler(async (req, res) => {
  const setting = await adminService.upsertSetting(req.params.key, req.body, req.user.id);
  return sendSuccess(res, { setting }, "Setting saved");
});
