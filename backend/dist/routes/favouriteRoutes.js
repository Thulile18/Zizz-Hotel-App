"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const favouriteController_1 = require("../controllers/favouriteController");
const router = (0, express_1.Router)();
// Every favourites action needs a logged-in guest
router.use(auth_1.requireLogin);
router.get('/', favouriteController_1.getFavourites);
router.put('/:hotelId', favouriteController_1.addToFavourites);
router.delete('/:hotelId', favouriteController_1.removeFromFavourites);
exports.default = router;
