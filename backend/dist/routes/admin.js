"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_1 = require("../controllers/admin");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication + admin role
router.use(auth_1.authenticate, auth_1.requireAdmin);
router.get('/stats', admin_1.getStats);
router.get('/flagged-posts', admin_1.getFlaggedPosts);
router.post('/posts/:id/remove', admin_1.removePost);
router.post('/posts/:id/clear', admin_1.clearPost);
router.post('/users/:id/suspend', admin_1.suspendUser);
router.post('/users/:id/unsuspend', admin_1.unsuspendUser);
router.get('/abuse-logs', admin_1.getAbuseLogs);
router.post('/abuse-logs/:id/resolve', admin_1.resolveAbuseLog);
router.get('/users', admin_1.getUsers);
exports.default = router;
