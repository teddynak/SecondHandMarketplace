import {config} from 'dotenv';
import mongoose from 'mongoose';
import ImageAsset from '../src/models/ImageAsset';
import Product from '../src/models/Product';
config({path:'.env.local'});config();
async function main(){
 const apply=process.argv.includes('--apply');const raw=process.argv.find(arg=>arg.startsWith('--days='))?.split('=')[1]||'7';const days=Number(raw);
 if(!Number.isInteger(days)||days<7)throw new Error('Use --days=N with at least seven days.');
 if(!process.env.MONGODB_URI)throw new Error('Set MONGODB_URI before reviewing image cleanup.');
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
 try{
  const cutoff=new Date(Date.now()-days*86400000);const filter={createdAt:{$lt:cutoff},$or:[{lastAttachedAt:{$lt:cutoff}},{lastAttachedAt:{$exists:false}}]};
  let candidates=0,deleted=0,retained=0;
  for await(const image of ImageAsset.find(filter).select('_id').cursor()){
   const path=`/api/images/${image._id}`;
   if(await Product.exists({images:path})){retained++;continue;}
   candidates++;
   if(apply)deleted+=await mongoose.connection.transaction(async session=>{
    if(await Product.exists({images:path}).session(session))return 0;
    const result=await ImageAsset.deleteOne({_id:image._id,...filter},{session});return result.deletedCount;
   });
  }
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',minimumAgeDays:days,candidates,deleted,referencedRetained:retained}));
  if(!apply)console.log('No images deleted. Review the counts and run with --apply only when ready.');
 }finally{await mongoose.disconnect();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Cleanup failed.');process.exitCode=1;});
