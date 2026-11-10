import {randomUUID} from 'node:crypto';
import {AppError} from './errors';
export function emailConfiguration(){
 const key=process.env.RESEND_API_KEY;const from=process.env.EMAIL_FROM;const raw=process.env.APP_URL;
 if(process.env.EMAIL_PROVIDER!=='resend'||!key||!from||!raw||key.startsWith('REPLACE_'))throw new AppError('Email delivery is not configured. The site operator must set EMAIL_PROVIDER, RESEND_API_KEY, EMAIL_FROM and APP_URL.',503);
 let app:URL;try{app=new URL(raw);}catch{throw new AppError('Email delivery is not configured correctly.',503);}
 const local=['localhost','127.0.0.1'].includes(app.hostname);
 if((app.protocol!=='https:'&&!(local&&app.protocol==='http:'))||app.username||app.password||app.pathname!=='/'||app.search||app.hash)throw new AppError('APP_URL must be the public HTTPS site origin (HTTP localhost is allowed for development).',503);
 const endpoint=process.env.EMAIL_API_URL||'https://api.resend.com/emails';let api:URL;try{api=new URL(endpoint);}catch{throw new AppError('Invalid email API endpoint.',503);}
 // A local HTTP endpoint is useful for isolated integration tests; never permit it on a public site.
 if(endpoint!=='https://api.resend.com/emails'&&!(local&&['localhost','127.0.0.1'].includes(api.hostname)&&api.protocol==='http:'&&!api.username&&!api.password))throw new AppError('Invalid email API endpoint.',503);
 return {key,from,origin:app.origin,endpoint};
}
export async function sendAccountEmail(to:string,purpose:'reset'|'verify',token:string){
 const config=emailConfiguration();const path=purpose==='reset'?'/reset-password':'/verify-email';
 const text=`${purpose==='reset'?'Reset your ReUse Market password':'Verify your ReUse Market email'}\n\nOpen this link and confirm the action:\n${config.origin}${path}?token=${token}\n\nThis link expires in ${purpose==='reset'?'30 minutes':'24 hours'} and can only be used once. If you did not request this, ignore this email. Never share this link.`;
 try{const response=await fetch(config.endpoint,{method:'POST',headers:{Authorization:`Bearer ${config.key}`,'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:JSON.stringify({from:config.from,to:[to],subject:purpose==='reset'?'Reset your ReUse password':'Verify your ReUse email',text}),signal:AbortSignal.timeout(10000)});const result=await response.json();if(!response.ok||typeof result.id!=='string')throw new Error('Provider did not accept the email.');}
 catch{throw new AppError('The email provider did not confirm acceptance. Please try again later. No delivery has been confirmed.',503);}
}
