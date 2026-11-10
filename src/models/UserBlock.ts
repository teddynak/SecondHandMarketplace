import mongoose,{Schema,model,models,Types} from 'mongoose';
export interface IUserBlock {blockerId:Types.ObjectId;blockedId:Types.ObjectId;createdAt:Date}
const schema=new Schema<IUserBlock>({blockerId:{type:Schema.Types.ObjectId,required:true},blockedId:{type:Schema.Types.ObjectId,required:true}},{timestamps:true});
schema.index({blockerId:1,blockedId:1},{unique:true});schema.index({blockedId:1,blockerId:1});
export default (models.UserBlock as mongoose.Model<IUserBlock>)||model<IUserBlock>('UserBlock',schema);
