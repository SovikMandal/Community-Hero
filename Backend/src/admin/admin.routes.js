// Admin routes — mounted at /api/admin.
//
// Every route requires a valid token AND the ADMIN role. The guard is applied
// once at the router level so individual handlers never run for non-admins.
import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getOverview,
  listIssues,
  getIssue,
  getIssueContributors,
  generateRejectReason,
  updateIssueStatus,
  assignIssue,
  deleteIssue,
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listUsers,
  updateUserRole,
  deleteUser,
  listAuditLogs,
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listSettings,
  upsertSetting,
} from "./admin.controller.js";

const router = Router();

// Apply auth + ADMIN authorization to the entire admin surface.
router.use(authenticate, authorize("ADMIN"));

// Dashboard
router.get("/overview", getOverview);

// Issues (Reports)
router.get("/issues", listIssues);
router.get("/issues/:id", getIssue);
router.get("/issues/:id/contributors", getIssueContributors);
router.post("/issues/:id/reject-reason", generateRejectReason);
router.patch("/issues/:id/status", updateIssueStatus);
router.patch("/issues/:id/assign", assignIssue);
router.delete("/issues/:id", deleteIssue);

// Departments
router.get("/departments", listDepartments);
router.post("/departments", createDepartment);
router.patch("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// Users
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Audit log
router.get("/audit-logs", listAuditLogs);

// Announcements
router.get("/announcements", listAnnouncements);
router.get("/announcements/:id", getAnnouncement);
router.post("/announcements", createAnnouncement);
router.patch("/announcements/:id", updateAnnouncement);
router.delete("/announcements/:id", deleteAnnouncement);

// System settings
router.get("/settings", listSettings);
router.put("/settings/:key", upsertSetting);

export default router;
