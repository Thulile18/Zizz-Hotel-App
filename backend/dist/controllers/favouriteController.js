"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFavourites = getFavourites;
exports.addToFavourites = addToFavourites;
exports.removeFromFavourites = removeFromFavourites;
const hotelService_1 = require("../services/hotelService");
const favouriteService_1 = require("../services/favouriteService");
// Turns the :hotelId in the web address into a number, or throws a 400 error
function getHotelId(req) {
    const id = Number(req.params.hotelId);
    if (!Number.isInteger(id))
        throw new hotelService_1.HttpError(400, 'Invalid hotel id');
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
// READ my favourites
async function getFavourites(req, res) {
    try {
        res.json(await (0, favouriteService_1.myFavourites)(req.user.id));
    }
    catch (err) {
        sendError(res, err);
    }
}
// SAVE a hotel as a favourite
async function addToFavourites(req, res) {
    try {
        await (0, favouriteService_1.saveFavourite)(req.user.id, getHotelId(req));
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
// REMOVE a favourite
async function removeFromFavourites(req, res) {
    try {
        await (0, favouriteService_1.deleteFavourite)(req.user.id, getHotelId(req));
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
