import type {ClientSession} from 'mongoose';
import Notification from '@/models/Notification';
export async function notify(userId:string,eventKey:string,title:string,body:string,href:string,type:'message'|'moderation',session:ClientSession){
 await Notification.create([{userId,eventKey,title,body:body.slice(0,1000),href,type}],{session});
}
