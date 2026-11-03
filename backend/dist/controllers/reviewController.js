"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postReview = postReview;
const hotelService_1 = require("../services/hotelService");
const reviewService_1 = require("../services/reviewService");
// One place that turns any error into an answer for the website
function sendError(res, err) {
    if (err instanceof hotelService_1.HttpError) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
// Write or update my review of a hotel
async function postReview(req, res) {
    try {
        const hotelId = Number(req.params.hotelId);
        if (!Number.isInteger(hotelId))
            throw new hotelService_1.HttpError(400, 'Invalid hotel id');
        await (0, reviewService_1.reviewHotel)(req.user.id, hotelId, req.body);
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
