"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReservations = getReservations;
exports.updateReservation = updateReservation;
exports.createPromotion = createPromotion;
const hotelService_1 = require("../services/hotelService");
const adminService_1 = require("../services/adminService");
// One place that turns any error into an answer for the website
function sendError(res, err) {
    if (err instanceof hotelService_1.HttpError) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
// READ every reservation
async function getReservations(_req, res) {
    try {
        res.json(await (0, adminService_1.allReservations)());
    }
    catch (err) {
        sendError(res, err);
    }
}
// UPDATE a reservation (approve, cancel or move the dates)
async function updateReservation(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id))
            throw new hotelService_1.HttpError(400, 'Invalid id');
        res.json(await (0, adminService_1.changeReservation)(id, req.body));
    }
    catch (err) {
        sendError(res, err);
    }
}
// CREATE a promotion for all guests
async function createPromotion(req, res) {
    try {
        res.status(201).json(await (0, adminService_1.sendPromotion)(req.body));
    }
    catch (err) {
        sendError(res, err);
    }
}
