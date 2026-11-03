"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const offerController_1 = require("../controllers/offerController");
const router = (0, express_1.Router)();
// Public: active promo offers for the homepage
router.get('/', offerController_1.getOffersList);
// Admin only: manage campaigns
router.post('/', auth_1.requireLogin, auth_1.requireAdmin, offerController_1.createNewOffer);
router.delete('/:id', auth_1.requireLogin, auth_1.requireAdmin, offerController_1.deleteOfferById);
exports.default = router;
