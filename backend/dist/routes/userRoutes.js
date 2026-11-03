"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const userController_1 = require("../controllers/userController");
const credentialController_1 = require("../controllers/credentialController");
const router = (0, express_1.Router)();
// All of these need a logged-in user
router.use(auth_1.requireLogin);
router.get('/me', userController_1.getMe);
router.put('/me', userController_1.updateMe);
router.put('/me/password', credentialController_1.changePassword);
router.put('/me/email', credentialController_1.changeEmail);
router.get('/me/export', userController_1.exportMe);
router.delete('/me', userController_1.deleteMe);
exports.default = router;
