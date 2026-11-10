import mongoose,{Schema,model,models,Types} from 'mongoose';
export interface IConversation { listingId:Types.ObjectId;buyerId:Types.ObjectId;sellerId:Types.ObjectId;listingTitle:string;sequence:number;lastMessage:string;lastActivityAt:Date;createdAt:Date }
const schema=new Schema<IConversation>({listingId:{type:Schema.Types.ObjectId,required:true},buyerId:{type:Schema.Types.ObjectId,required:true},sellerId:{type:Schema.Types.ObjectId,required:true},listingTitle:{type:String,required:true},sequence:{type:Number,default:0},lastMessage:{type:String,default:''},lastActivityAt:{type:Date,default:Date.now}},{timestamps:true});
schema.index({listingId:1,buyerId:1,sellerId:1},{unique:true});
schema.index({buyerId:1,lastActivityAt:-1,_id:-1});schema.index({sellerId:1,lastActivityAt:-1,_id:-1});
export default (models.Conversation as mongoose.Model<IConversation>)||model<IConversation>('Conversation',schema);
