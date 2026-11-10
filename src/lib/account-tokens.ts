import {createHash,randomBytes} from 'node:crypto';
import AccountToken from '@/models/AccountToken';
import {sendAccountEmail} from './email';
export const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
export async function issueAccountToken(userId:string,email:string,purpose:'reset'|'verify'){
 const token=randomBytes(32).toString('hex');await AccountToken.init();
 const record=await AccountToken.create({userId,email,purpose,hash:hashToken(token),expiresAt:new Date(Date.now()+(purpose==='reset'?30*60:24*60*60)*1000)});
 try{await sendAccountEmail(email,purpose,token);}catch(error){await AccountToken.deleteOne({_id:record._id});throw error;}
}
