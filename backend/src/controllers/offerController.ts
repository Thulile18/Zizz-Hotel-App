import { Request, Response } from 'express';
import { z } from 'zod';
import { getActiveOffers, createOffer, deleteOffer } from '../modals/offerModal';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use dates like 2026-12-31');

const offerSchema = z
  .object({
    hotel_id: z.number().int(),
    title: z.string().min(1, 'Title is required').max(100),
    description: z.string().max(500).optional(),
    discount_percent: z.number().int().min(1, 'Discount must be 1 to 100').max(100, 'Discount must be 1 to 100'),
    is_published: z.boolean().default(false),
    booking_start: day,
    booking_end: day,
    stay_end: day,
    quantity: z.number().int().min(1, 'Quantity must be at least 1').optional(),
  })
  .refine((o) => o.booking_end >= o.booking_start, { message: 'Booking end cannot be before booking start' })
  .refine((o) => o.stay_end >= o.booking_start, { message: 'Stay end cannot be before booking start' });

function sendError(res: Response, err: unknown) {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
}

// READ the active offers (public)
export async function getOffersList(_req: Request, res: Response) {
  try {
    res.json(await getActiveOffers());
  } catch (err) {
    sendError(res, err);
  }
}

// CREATE an offer (admin)
export async function createNewOffer(req: Request, res: Response) {
  const parsed = offerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  try {
    const id = await createOffer(parsed.data);
    res.status(201).json({ id });
  } catch (err) {
    // 23503: the hotel id does not exist
    if ((err as { code?: string }).code === '23503') return res.status(404).json({ error: 'Hotel not found' });
    sendError(res, err);
  }
}

// DELETE an offer (admin)
export async function deleteOfferById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid offer id' });
    if (!(await deleteOffer(id))) return res.status(404).json({ error: 'Offer not found' });
    res.status(204).send();
  } catch (err) {
    sendError(res, err);
  }
}