import mongoose,{Schema,model,models,Types} from 'mongoose';
export interface IMessage {conversationId:Types.ObjectId;senderId:Types.ObjectId;recipientId:Types.ObjectId;text:string;sequence:number;clientId:string;readAt:Date|null;createdAt:Date}
const schema=new Schema<IMessage>({conversationId:{type:Schema.Types.ObjectId,required:true},senderId:{type:Schema.Types.ObjectId,required:true},recipientId:{type:Schema.Types.ObjectId,required:true},text:{type:String,required:true,maxlength:2000},sequence:{type:Number,required:true},clientId:{type:String,required:true},readAt:{type:Date,default:null}},{timestamps:true});
schema.index({conversationId:1,sequence:1},{unique:true});schema.index({conversationId:1,clientId:1},{unique:true});schema.index({recipientId:1,readAt:1,conversationId:1});
export default (models.Message as mongoose.Model<IMessage>)||model<IMessage>('Message',schema);
