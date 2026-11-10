import {z} from 'zod';
import {registerSchema} from './validators';
export const emailSchema=z.string().trim().toLowerCase().max(160).pipe(z.email());
export const tokenSchema=z.string().regex(/^[a-f0-9]{64}$/,'This link is invalid. Request a new one.');
export const changePasswordSchema=z.object({currentPassword:z.string().min(1).max(128),newPassword:registerSchema.shape.password});
export const resetPasswordSchema=z.object({token:tokenSchema,newPassword:registerSchema.shape.password});
