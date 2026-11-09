import mongoose from 'mongoose';
import { AppError } from './errors';

type Cache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = globalThis as typeof globalThis & { __mongooseCache?: Cache };
const cached = globalForMongoose.__mongooseCache ?? { conn: null, promise: null };
globalForMongoose.__mongooseCache = cached;

export async function connectDb() {
 const uri = process.env.MONGODB_URI;
 if (!uri || uri.includes('USERNAME:PASSWORD')) throw new AppError('Database not configured. Add your MongoDB URI to .env.local.', 503);
 if (cached.conn) return cached.conn;
 if (!cached.promise) cached.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 7000 }).catch(() => { cached.promise = null; throw new AppError('MongoDB connection failed. Check your connection string, cluster access, and network.', 503); });
 cached.conn = await cached.promise;
 return cached.conn;
}
