import mongoose, { Schema, models, model, Types } from 'mongoose';
export interface IImageAsset { ownerId: Types.ObjectId; contentType: string; data: Buffer; sizeBytes?:number;lastAttachedAt?:Date;createdAt: Date; }
const ImageAssetSchema = new Schema<IImageAsset>({
 sizeBytes:{type:Number,min:0},lastAttachedAt:{type:Date,default:Date.now},
 ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
 contentType: { type: String, enum: ['image/jpeg','image/png','image/webp'], required: true },
 data: { type: Buffer, required: true }
}, { timestamps: { createdAt: true, updatedAt: false } });
export default (models.ImageAsset as mongoose.Model<IImageAsset>) || model<IImageAsset>('ImageAsset', ImageAssetSchema);
