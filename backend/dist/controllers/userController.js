"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.exportMe = exportMe;
exports.deleteMe = deleteMe;
const hotelService_1 = require("../services/hotelService");
const userService_1 = require("../services/userService");
// One place that turns any error into an answer for the website
function sendError(res, err) {
    if (err instanceof hotelService_1.HttpError) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
// READ my profile
async function getMe(req, res) {
    try {
        res.json(await (0, userService_1.getProfile)(req.user.id));
    }
    catch (err) {
        sendError(res, err);
    }
}
// UPDATE my profile
async function updateMe(req, res) {
    try {
        res.json(await (0, userService_1.editProfile)(req.user.id, req.body));
    }
    catch (err) {
        sendError(res, err);
    }
}
// DOWNLOAD everything we hold about me
async function exportMe(req, res) {
    try {
        res.json(await (0, userService_1.downloadMyData)(req.user.id));
    }
    catch (err) {
        sendError(res, err);
    }
}
// DELETE my account (anonymise it)
async function deleteMe(req, res) {
    try {
        await (0, userService_1.deleteMyAccount)(req.user.id, req.user.role);
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
