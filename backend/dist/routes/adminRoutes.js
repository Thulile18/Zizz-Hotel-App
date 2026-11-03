"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Everything here needs a logged-in admin: first the login check, then the admin check
router.use(auth_1.requireLogin, auth_1.requireAdmin);
router.get('/bookings', adminController_1.getReservations);
router.patch('/bookings/:id', adminController_1.updateReservation);
router.post('/promotions', adminController_1.createPromotion);
exports.default = router;
