import {z} from 'zod';
export const objectId=z.string().regex(/^[a-f\d]{24}$/i,'Invalid identifier.');
export const startConversationSchema=z.object({listingId:objectId});
export const sendMessageSchema=z.object({text:z.string().trim().min(1,'Write a message first.').max(2000,'Messages may contain up to 2,000 characters.'),clientId:z.string().uuid('Invalid message identifier.')});
export const reportConversationSchema=z.object({conversationId:objectId,reason:z.string().trim().min(10,'Please give at least 10 characters of detail.').max(1000)});
export const readMessagesSchema=z.object({through:z.number().int().min(1).max(Number.MAX_SAFE_INTEGER)});
export const reviewReportSchema=z.object({adminNote:z.string().trim().min(5,'Explain the review outcome.').max(1000)});
