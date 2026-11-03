"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewBooking = createNewBooking;
exports.confirmBooking = confirmBooking;
exports.getMyBookings = getMyBookings;
exports.cancelBooking = cancelBooking;
const hotelService_1 = require("../services/hotelService");
const bookingService_1 = require("../services/bookingService");
// Turns the :id in the web address into a number, or throws a 400 error
function getId(req) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id))
        throw new hotelService_1.HttpError(400, 'Invalid id');
    return id;
}
// One place that turns any error into an answer for the website
function sendError(res, err) {
    if (err instanceof hotelService_1.HttpError) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
// CREATE a booking and start the payment
async function createNewBooking(req, res) {
    try {
        res.status(201).json(await (0, bookingService_1.bookRoom)(req.user.id, req.body));
    }
    catch (err) {
        sendError(res, err);
    }
}
// After paying: check with Stripe and confirm the booking
async function confirmBooking(req, res) {
    try {
        res.json(await (0, bookingService_1.confirmPayment)(req.user.id, getId(req)));
    }
    catch (err) {
        sendError(res, err);
    }
}
// READ my own bookings
async function getMyBookings(req, res) {
    try {
        res.json(await (0, bookingService_1.myBookings)(req.user.id));
    }
    catch (err) {
        sendError(res, err);
    }
}
// CANCEL one of my bookings
async function cancelBooking(req, res) {
    try {
        await (0, bookingService_1.cancelMyBooking)(req.user.id, getId(req));
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
