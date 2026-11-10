import mongoose,{Schema,models,model,Types} from 'mongoose';
export interface IAccountToken {userId:Types.ObjectId;hash:string;purpose:'reset'|'verify';email:string;expiresAt:Date;usedAt:Date|null;createdAt:Date}
const schema=new Schema<IAccountToken>({userId:{type:Schema.Types.ObjectId,required:true},hash:{type:String,required:true,unique:true},purpose:{type:String,enum:['reset','verify'],required:true},email:{type:String,required:true},expiresAt:{type:Date,required:true},usedAt:{type:Date,default:null}},{timestamps:true});schema.index({expiresAt:1},{expireAfterSeconds:0});schema.index({userId:1,purpose:1});
export default (models.AccountToken as mongoose.Model<IAccountToken>)||model<IAccountToken>('AccountToken',schema);
