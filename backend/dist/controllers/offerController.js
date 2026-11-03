"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOffersList = getOffersList;
exports.createNewOffer = createNewOffer;
exports.deleteOfferById = deleteOfferById;
const zod_1 = require("zod");
const offerModal_1 = require("../modals/offerModal");
const day = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use dates like 2026-12-31');
const offerSchema = zod_1.z
    .object({
    hotel_id: zod_1.z.number().int(),
    title: zod_1.z.string().min(1, 'Title is required').max(100),
    description: zod_1.z.string().max(500).optional(),
    discount_percent: zod_1.z.number().int().min(1, 'Discount must be 1 to 100').max(100, 'Discount must be 1 to 100'),
    is_published: zod_1.z.boolean().default(false),
    booking_start: day,
    booking_end: day,
    stay_end: day,
    quantity: zod_1.z.number().int().min(1, 'Quantity must be at least 1').optional(),
})
    .refine((o) => o.booking_end >= o.booking_start, { message: 'Booking end cannot be before booking start' })
    .refine((o) => o.stay_end >= o.booking_start, { message: 'Stay end cannot be before booking start' });
function sendError(res, err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
}
// READ the active offers (public)
async function getOffersList(_req, res) {
    try {
        res.json(await (0, offerModal_1.getActiveOffers)());
    }
    catch (err) {
        sendError(res, err);
    }
}
// CREATE an offer (admin)
async function createNewOffer(req, res) {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.issues[0].message });
    try {
        const id = await (0, offerModal_1.createOffer)(parsed.data);
        res.status(201).json({ id });
    }
    catch (err) {
        // 23503: the hotel id does not exist
        if (err.code === '23503')
            return res.status(404).json({ error: 'Hotel not found' });
        sendError(res, err);
    }
}
// DELETE an offer (admin)
async function deleteOfferById(req, res) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id))
            return res.status(400).json({ error: 'Invalid offer id' });
        if (!(await (0, offerModal_1.deleteOffer)(id)))
            return res.status(404).json({ error: 'Offer not found' });
        res.status(204).send();
    }
    catch (err) {
        sendError(res, err);
    }
}
