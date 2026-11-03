"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const bookingController_1 = require("../controllers/bookingController");
const router = (0, express_1.Router)();
// Every booking action needs a logged-in guest
router.use(auth_1.requireLogin);
router.post('/', bookingController_1.createNewBooking);
router.get('/', bookingController_1.getMyBookings);
router.post('/:id/confirm', bookingController_1.confirmBooking);
router.delete('/:id', bookingController_1.cancelBooking);
exports.default = router;
