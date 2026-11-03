"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.listHotels = listHotels;
exports.getHotel = getHotel;
exports.addHotel = addHotel;
exports.editHotel = editHotel;
exports.editRoom = editRoom;
exports.removeHotel = removeHotel;
const zod_1 = require("zod");
const hotelModal_1 = require("../modals/hotelModal");
// An error that carries an HTTP status code (404 not found, 400 bad data...)
class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
exports.HttpError = HttpError;
// ---- The rules ----
const roomSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'Room type is required'),
    capacity: zod_1.z.number().int().min(1, 'A room must sleep at least 1 guest'),
    price_per_night: zod_1.z.number().positive('Price must be more than 0'),
    total_rooms: zod_1.z.number().int().min(0, 'Number of rooms cannot be negative'),
    image_path: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    amenities: zod_1.z.array(zod_1.z.string()).optional(),
});
const hotelFields = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Hotel name is required'),
    slug: zod_1.z.string().optional(),
    tagline: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    address: zod_1.z.string().min(1, 'Address is required'),
    city: zod_1.z.string().min(1, 'City is required'),
    region: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    lat: zod_1.z.number().optional(),
    lng: zod_1.z.number().optional(),
    stars: zod_1.z.number().int().min(1, 'Stars must be 1 to 5').max(5, 'Stars must be 1 to 5'),
    is_featured: zod_1.z.boolean().optional(),
    property_type: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    facilities: zod_1.z.array(zod_1.z.string()).default([]),
    policies: zod_1.z.string().optional(),
});
const newHotelSchema = hotelFields.extend({
    images: zod_1.z.array(zod_1.z.string()).default([]),
    rooms: zod_1.z.array(roomSchema).min(1, 'Add at least one room type'),
});
const roomUpdateSchema = zod_1.z.object({
    price_per_night: zod_1.z.number().positive('Price must be more than 0'),
    total_rooms: zod_1.z.number().int().min(0, 'Number of rooms cannot be negative'),
});
// Checks data against a rule set, or throws a 400 error with a friendly message
function check(schema, data) {
    const parsed = schema.safeParse(data);
    if (!parsed.success)
        throw new HttpError(400, parsed.error.issues[0].message);
    return parsed.data;
}
// ---- The actions ----
function listHotels(query) {
    const q = String(query.q ?? '');
    const maxPrice = Number(query.maxPrice) || 100000;
    const minStars = Number(query.minStars) || 0;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 100));
    return (0, hotelModal_1.searchHotels)(q, maxPrice, minStars, page, limit);
}
async function getHotel(id) {
    const hotel = await (0, hotelModal_1.findHotelById)(id);
    if (!hotel)
        throw new HttpError(404, 'Hotel not found');
    return hotel;
}
async function addHotel(body) {
    const data = check(newHotelSchema, body);
    const id = await (0, hotelModal_1.createHotel)(data);
    return { id };
}
async function editHotel(id, body) {
    const data = check(hotelFields, body);
    const changed = await (0, hotelModal_1.updateHotel)(id, data);
    if (!changed)
        throw new HttpError(404, 'Hotel not found');
}
async function editRoom(id, body) {
    const data = check(roomUpdateSchema, body);
    const changed = await (0, hotelModal_1.updateRoom)(id, data.price_per_night, data.total_rooms);
    if (!changed)
        throw new HttpError(404, 'Room not found');
}
async function removeHotel(id) {
    try {
        const removed = await (0, hotelModal_1.deleteHotel)(id);
        if (!removed)
            throw new HttpError(404, 'Hotel not found');
    }
    catch (err) {
        // 23503 is the database's code for "something still points at this row"
        if (err.code === '23503') {
            throw new HttpError(409, 'This hotel has bookings, so it cannot be deleted.');
        }
        throw err;
    }
}
