import {z} from 'zod';
import {contentSchema} from './schema';
export const auditSchema=z.object({id:z.uuid(),at:z.iso.datetime(),actor:z.string().min(1).max(120),reason:z.string().min(5).max(300),revision:z.number().int().min(2),hash:z.string().regex(/^[a-f0-9]{64}$/),previousHash:z.string().regex(/^$|^[a-f0-9]{64}$/),changed:z.array(z.string().max(100)).max(30)}).strict();
export const documentSchema=z.object({content:contentSchema,audit:z.array(auditSchema).max(2000)}).strict();
