import { AlertCircle } from 'lucide-react';
export function Notice({message,onRetry}:{message:string;onRetry?:()=>void}){return <div className="notice" role="alert"><AlertCircle size={19}/><span>{message}</span>{onRetry&&<button className="notice-retry" type="button" onClick={onRetry}>Try again</button>}</div>;}
