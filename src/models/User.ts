import mongoose, { Schema, models, model } from 'mongoose';
export interface IUser {
 name: string; email: string; passwordHash: string; phone: string; location: string;
 role: 'buyer'|'seller'|'admin'; createdAt: Date; updatedAt: Date;
}
const UserSchema = new Schema<IUser>({
 name: { type: String, required: true, trim: true },
 email: { type: String, required: true, lowercase: true, trim: true, unique: true },
 passwordHash: { type: String, required: true, select: false },
 phone: { type: String, required: true }, location: { type: String, required: true },
 role: { type: String, enum: ['buyer','seller','admin'], default: 'buyer' },
}, { timestamps: true });
export default (models.User as mongoose.Model<IUser>) || model<IUser>('User', UserSchema);
