"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
// Notifications belong to one user, so you must be logged in
router.get('/', auth_1.requireLogin, notificationController_1.getNotifications);
exports.default = router;
