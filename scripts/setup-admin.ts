import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
config({path:'.env.local'});
config();
async function main() {
 const uri=process.env.MONGODB_URI;
 const email=process.env.ADMIN_EMAIL?.trim().toLowerCase();
 const password=process.env.ADMIN_PASSWORD;
 if(!uri || uri.includes('USERNAME:PASSWORD'))throw new Error('Set MONGODB_URI in .env.local first.');
 if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Set a valid ADMIN_EMAIL in .env.local.');
 if(!password || password.startsWith('REPLACE_') || password.length<8 || Buffer.byteLength(password)>72)throw new Error('Set ADMIN_PASSWORD with 8+ characters (maximum 72 UTF-8 bytes).');
 await mongoose.connect(uri,{serverSelectionTimeoutMS:10000});
 try {
  await User.init();
  const passwordHash=await bcrypt.hash(password,12);
  const result=await User.updateOne({email},{$set:{role:'admin',passwordHash},$inc:{sessionVersion:1},$setOnInsert:{name:'Marketplace Administrator',phone:'+256 000 000 000',location:'Kampala'}},{upsert:true,runValidators:true});
  console.log(`${result.upsertedCount?'Created':'Updated'} administrator: ${email}`);
  console.log('Sign in with ADMIN_PASSWORD. This command also resets the password of an existing account with that email.');
 }finally{await mongoose.disconnect();}
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Admin setup failed.');process.exitCode=1;});
