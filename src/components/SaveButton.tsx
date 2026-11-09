'use client';
import { Heart, LoaderCircle } from 'lucide-react';
import { useSaved } from './SavedProvider';
export default function SaveButton({id,title,compact=false}:{id:string;title:string;compact?:boolean}){
 const {ids,ready,pending,error,toggle}=useSaved();const saved=ids.includes(id);const busy=pending.includes(id);
 return <button type="button" className={`${compact?'save-heart':'btn btn-outline save-listing'} ${saved?'is-saved':''}`} disabled={!ready||busy} title={error?'Saved items could not be loaded. Open Saved items to retry.':undefined} aria-pressed={saved} aria-label={saved?`Remove ${title} from saved items`:`Save ${title}`} onClick={()=>void toggle(id)}>{busy?<LoaderCircle size={19} className="spin"/>:<Heart size={19} fill={saved?'currentColor':'none'}/>} {!compact&&(saved?'Saved':'Save item')}</button>;
}
