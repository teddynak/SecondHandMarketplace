import mongoose, { Schema, models, model, Types } from 'mongoose';
import { CATEGORIES } from '@/types';
export interface IProduct {
 title: string; description: string; category: string; price: number; condition: string;
 images: string[]; sellerId: Types.ObjectId; sellerName: string; sellerEmail: string;
 sellerPhone: string; location: string; status: 'available'|'sold'|'archived';
 paymentStatus: 'unpaid'|'paid'; createdAt: Date; updatedAt: Date;
}
const ProductSchema = new Schema<IProduct>({
 title: { type: String, required: true, trim: true }, description: { type: String, required: true },
 category: { type: String, enum: CATEGORIES, required: true }, price: { type: Number, min: 1, required: true },
 condition: { type: String, enum: ['Used','New','Like new','Good','Fair'], default: 'Used', required: true },
 images: { type: [String], default: [] },
 sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
 sellerName: { type: String, required: true }, sellerEmail: { type: String, required: true },
 sellerPhone: { type: String, required: true }, location: { type: String, required: true },
 status: { type: String, enum: ['available', 'sold', 'archived'], default: 'available', index: true },
 paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
}, { timestamps: true, optimisticConcurrency: true });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ category: 1, status: 1, price: 1 });
export default (models.Product as mongoose.Model<IProduct>) || model<IProduct>('Product', ProductSchema);
