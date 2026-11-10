import mongoose,{Schema,models,model,Types} from 'mongoose';
export interface INotification {userId:Types.ObjectId;eventKey:string;type:'message'|'moderation';title:string;body:string;href:string;readAt:Date|null;createdAt:Date}
const schema=new Schema<INotification>({userId:{type:Schema.Types.ObjectId,required:true},eventKey:{type:String,required:true,unique:true},type:{type:String,enum:['message','moderation'],required:true},title:{type:String,required:true},body:{type:String,required:true},href:{type:String,required:true},readAt:{type:Date,default:null}},{timestamps:true});schema.index({userId:1,createdAt:-1,_id:-1});schema.index({userId:1,readAt:1});
export default (models.Notification as mongoose.Model<INotification>)||model<INotification>('Notification',schema);
