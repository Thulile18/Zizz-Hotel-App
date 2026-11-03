"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewHotel = reviewHotel;
const zod_1 = require("zod");
const hotelService_1 = require("./hotelService");
const reviewModal_1 = require("../modals/reviewModal");
const reviewSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1, 'Rating must be 1 to 5').max(5, 'Rating must be 1 to 5'),
    comment: zod_1.z.string().max(1000, 'Comment can be at most 1000 characters').optional(),
});
async function reviewHotel(userId, hotelId, body) {
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success)
        throw new hotelService_1.HttpError(400, parsed.error.issues[0].message);
    if (!(await (0, reviewModal_1.hasConfirmedBooking)(userId, hotelId))) {
        throw new hotelService_1.HttpError(403, 'Only guests who have completed a stay can review this hotel');
    }
    await (0, reviewModal_1.saveReview)(userId, hotelId, parsed.data.rating, parsed.data.comment || null);
}
