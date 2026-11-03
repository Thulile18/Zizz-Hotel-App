"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myFavourites = myFavourites;
exports.saveFavourite = saveFavourite;
exports.deleteFavourite = deleteFavourite;
const hotelService_1 = require("./hotelService");
const favouriteModal_1 = require("../modals/favouriteModal");
function myFavourites(userId) {
    return (0, favouriteModal_1.listFavourites)(userId);
}
async function saveFavourite(userId, hotelId) {
    if (!(await (0, favouriteModal_1.hotelExists)(hotelId)))
        throw new hotelService_1.HttpError(404, 'Hotel not found');
    await (0, favouriteModal_1.addFavourite)(userId, hotelId);
}
async function deleteFavourite(userId, hotelId) {
    await (0, favouriteModal_1.removeFavourite)(userId, hotelId);
}
