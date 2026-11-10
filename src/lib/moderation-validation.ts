import {z} from 'zod';
import {objectId} from './messaging-validation';
export const entityReportSchema=z.object({kind:z.enum(['listing','user']),targetId:objectId,reason:z.string().trim().min(10,'Please give at least 10 characters of detail.').max(1000)});
export const moderationSchema=z.object({action:z.enum(['suspend','restore-account','hide-listing','restore-listing','review-report']),targetId:objectId,reason:z.string().trim().min(10,'Explain your decision in at least 10 characters.').max(1000)});
