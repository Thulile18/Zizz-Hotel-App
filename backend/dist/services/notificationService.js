"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myNotifications = myNotifications;
const notificationModal_1 = require("../modals/notificationModal");
function myNotifications(userId) {
    return (0, notificationModal_1.listNotifications)(userId);
}
