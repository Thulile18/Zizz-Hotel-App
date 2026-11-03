"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotifications = getNotifications;
const notificationService_1 = require("../services/notificationService");
// READ my notifications
async function getNotifications(req, res) {
    try {
        res.json(await (0, notificationService_1.myNotifications)(req.user.id));
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}
