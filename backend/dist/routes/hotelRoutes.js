"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const hotelController_1 = require("../controllers/hotelController");
const router = (0, express_1.Router)();
// Anyone can read
router.get('/', hotelController_1.getHotels);
router.get('/:id', hotelController_1.getHotelById);
// Only logged-in admins can change things
router.post('/', auth_1.requireLogin, auth_1.requireAdmin, hotelController_1.createNewHotel);
router.put('/rooms/:id', auth_1.requireLogin, auth_1.requireAdmin, hotelController_1.updateRoomDetails);
router.put('/:id', auth_1.requireLogin, auth_1.requireAdmin, hotelController_1.updateHotelDetails);
router.delete('/:id', auth_1.requireLogin, auth_1.requireAdmin, hotelController_1.deleteHotelById);
exports.default = router;
