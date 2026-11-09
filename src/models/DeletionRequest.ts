import mongoose, { Schema, models, model, Types } from 'mongoose';
export interface IDeletionRequest {
 productId: Types.ObjectId; requestedBy: Types.ObjectId; reason: string;
 status: 'pending'|'approved'|'rejected'; adminNote?: string;
 reviewedBy?: Types.ObjectId; reviewedAt?: Date; createdAt: Date; updatedAt: Date;
}
const DeletionRequestSchema = new Schema<IDeletionRequest>({
 productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
 requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
 reason: { type: String, required: true },
 status: { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },
 adminNote: String, reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' }, reviewedAt: Date
}, { timestamps: true, optimisticConcurrency: true });
DeletionRequestSchema.index({ productId: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });
export default (models.DeletionRequest as mongoose.Model<IDeletionRequest>) || model<IDeletionRequest>('DeletionRequest', DeletionRequestSchema);
