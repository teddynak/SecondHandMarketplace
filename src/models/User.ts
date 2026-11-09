import mongoose, { Schema, models, model } from 'mongoose';
export interface IUser {
 name: string; email: string; passwordHash: string; phone: string; location: string;
 role: 'buyer'|'seller'|'admin'; favoriteIds: mongoose.Types.ObjectId[]; savedSearches: {id:string;label:string;params:string}[]; createdAt: Date; updatedAt: Date;
}
const SavedSearchSchema = new Schema({ id: {type:String,required:true}, label: {type:String,required:true}, params: {type:String,required:true} }, {_id:false});
const UserSchema = new Schema<IUser>({
 name: { type: String, required: true, trim: true },
 email: { type: String, required: true, lowercase: true, trim: true, unique: true },
 passwordHash: { type: String, required: true, select: false },
 phone: { type: String, required: true }, location: { type: String, required: true },
 favoriteIds: {type:[Schema.Types.ObjectId],ref:'Product',default:[]},
 savedSearches: {type:[SavedSearchSchema],default:[]},
 role: { type: String, enum: ['buyer','seller','admin'], default: 'buyer' },
}, { timestamps: true });
export default (models.User as mongoose.Model<IUser>) || model<IUser>('User', UserSchema);
