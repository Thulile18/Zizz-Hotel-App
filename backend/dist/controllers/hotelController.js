"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHotels = getHotels;
exports.getHotelById = getHotelById;
exports.createNewHotel = createNewHotel;
exports.updateHotelDetails = updateHotelDetails;
exports.updateRoomDetails = updateRoomDetails;
exports.deleteHotelById = deleteHotelById;
const hotelService_1 = require("../services/hotelService");
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
// READ the list
async function getHotels(req, res) {
    try {
        res.json(await (0, hotelService_1.listHotels)(req.query));
    }
    catch (err) {
        sendError(res, err);
    }
}
// READ one hotel
async function getHotelById(req, res) {
    try {
        res.json(await (0, hotelService_1.getHotel)(getId(req)));
    }
    catch (err) {
        sendError(res, err);
    }
}
// CREATE a hotel (admin)
async function createNewHotel(req, res) {
    try {
        res.status(201).json(await (0, hotelService_1.addHotel)(req.body));
    }
    catch (err) {
        sendError(res, err);
    }
}
// UPDATE a hotel's details (admin)
async function updateHotelDetails(req, res) {
    try {
        await (0, hotelService_1.editHotel)(getId(req), req.body);
        res.json({ message: 'Hotel updated' });
    }
    catch (err) {
        sendError(res, err);
    }
}
// UPDATE a room's price and availability (admin)
async function updateRoomDetails(req, res) {
    try {
        await (0, hotelService_1.editRoom)(getId(req), req.body);
        res.json({ message: 'Room updated' });
    }
    catch (err) {
        sendError(res, err);
    }
}
// DELETE a hotel (admin)
async function deleteHotelById(req, res) {
    try {
        await (0, hotelService_1.removeHotel)(getId(req));
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
