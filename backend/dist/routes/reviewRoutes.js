"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reviewController_1 = require("../controllers/reviewController");
const router = (0, express_1.Router)();
// Writing a review needs a logged-in guest
router.put('/:hotelId', auth_1.requireLogin, reviewController_1.postReview);
exports.default = router;
