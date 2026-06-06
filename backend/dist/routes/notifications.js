"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notifications_1 = require("../controllers/notifications");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, notifications_1.listNotifications);
router.post('/mark-all-read', auth_1.authenticate, notifications_1.markAllRead);
exports.default = router;
