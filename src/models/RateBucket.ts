import mongoose,{Schema,models,model} from 'mongoose';
interface Bucket {_id:string;count:number;expiresAt:Date}
const schema=new Schema<Bucket>({_id:String,count:{type:Number,default:0},expiresAt:{type:Date,required:true}});
schema.index({expiresAt:1},{expireAfterSeconds:0});
export default (models.RateBucket as mongoose.Model<Bucket>)||model<Bucket>('RateBucket',schema);
