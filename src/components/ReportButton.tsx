'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Flag} from 'lucide-react';
import {useAuth} from './AuthProvider';
import Dialog from './Dialog';
import {api} from '@/lib/client';
export default function ReportButton({kind,targetId,ownerId}:{kind:'listing'|'user';targetId:string;ownerId:string}){
 const {user}=useAuth();const [open,setOpen]=useState(false);const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [submitted,setSubmitted]=useState(false);
 if(user?.id===ownerId)return null;
 async function submit(){if(busy)return;setBusy(true);setError('');try{await api('/api/entity-reports',{method:'POST',body:JSON.stringify({kind,targetId,reason})});setSubmitted(true);setOpen(false);}catch(error){setError((error as Error).message);}finally{setBusy(false);}}
 const label=kind==='listing'?'Report listing':'Report member';
 return <div className="entity-report">{submitted?<p role="status">Report submitted for administrator review.</p>:user?<button className="text-action" onClick={()=>setOpen(true)}><Flag size={16}/>{label}</button>:<Link className="text-action" href={`/login?next=${encodeURIComponent(kind==='listing'?`/items/${targetId}`:`/sellers/${targetId}`)}`}>Log in to {label.toLowerCase()}</Link>}{open&&<Dialog labelledBy="entity-report-title" busy={busy} onClose={()=>setOpen(false)}><h2 id="entity-report-title">{label}</h2><p>Explain the issue clearly. Administrators will review your report. This does not automatically remove the listing or suspend the member. Do not include passwords or payment details.</p><label className="field"><span>Report details</span><textarea data-autofocus rows={5} minLength={10} maxLength={1000} value={reason} onChange={event=>setReason(event.target.value)}/></label>{error&&<p className="form-error" role="alert">{error}</p>}<div className="dialog-actions"><button className="btn btn-outline" disabled={busy} onClick={()=>setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy||reason.trim().length<10} onClick={()=>void submit()}>{busy?'Submitting…':'Submit report'}</button></div></Dialog>}</div>;
}
