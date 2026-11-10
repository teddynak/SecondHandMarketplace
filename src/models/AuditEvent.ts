import mongoose,{Schema,models,model,Types} from 'mongoose';
export interface IAuditEvent {actorId:Types.ObjectId;action:string;targetId:string;reason:string;before:string;after:string;createdAt:Date}
const schema=new Schema<IAuditEvent>({actorId:{type:Schema.Types.ObjectId,required:true},action:{type:String,required:true},targetId:{type:String,required:true},reason:{type:String,required:true},before:String,after:String},{timestamps:{createdAt:true,updatedAt:false}});schema.index({createdAt:-1,_id:-1});
export default (models.AuditEvent as mongoose.Model<IAuditEvent>)||model<IAuditEvent>('AuditEvent',schema);
