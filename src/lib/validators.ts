import { z } from 'zod';
import { isImageSource } from './image-source';
import { CATEGORIES } from '@/types';
const simpleText = (min: number, max: number) => z.string().trim().min(min,`Enter at least ${min} characters.`).max(max,`Use no more than ${max} characters.`);
export const registerSchema = z.object({
 name: simpleText(2,70), email: z.string().trim().toLowerCase().max(160).pipe(z.email()),
 password: z.string().min(8, 'Password must be at least 8 characters.').max(128).refine(value => new TextEncoder().encode(value).length <= 72, 'Password must be at most 72 UTF-8 bytes.'),
 phone: simpleText(7,25), location: simpleText(2,120)
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().max(160).pipe(z.email()), password: z.string().min(1) });
export const profileSchema = z.object({ name: simpleText(2,70), phone: simpleText(7,25), location: simpleText(2,120) });
export const productSchema = z.object({
 title: simpleText(3,110), description: simpleText(15,2500), category: z.enum(CATEGORIES),
 price: z.number().int('Use whole Ugandan shillings.').min(1,'Enter a price of at least UGX 1.').max(1_000_000_000,'Price must not exceed UGX 1,000,000,000.'), condition: z.literal('Used', {error:'Only used items may be listed on ReUse.'}).default('Used'),
 location: simpleText(2,120), sellerPhone: simpleText(7,25),
 images: z.array(z.string().trim().max(2048).refine(isImageSource, 'Use an uploaded image or a valid HTTPS image URL.')).max(4).refine(values => new Set(values).size === values.length, 'Each photo must be unique.')
});
export const productUpdateSchema = productSchema.partial().refine((v) => Object.keys(v).length > 0, 'Nothing to update.');
export const deletionSchema = z.object({ productId: z.string().regex(/^[a-f\d]{24}$/i), reason: simpleText(10,600) });
export const decisionSchema = z.object({ decision: z.enum(['approved', 'rejected']), adminNote: z.string().trim().max(600).optional() });
export const saleSchema = z.object({ action: z.literal('complete-sale'), paid: z.boolean() });
export const markPaidSchema = z.object({ action: z.literal('mark-paid') });
