'use client';
import { useLayoutEffect,useRef } from 'react';
/** Native modal provides focus containment, an inert background and focus restoration. */
export default function Dialog({children,labelledBy,describedBy,onClose,busy=false,wide=false}:{children:React.ReactNode;labelledBy:string;describedBy?:string;onClose:()=>void;busy?:boolean;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useLayoutEffect(()=>{const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;const dialog=ref.current;if(!dialog)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';if(!dialog.open)dialog.showModal();dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();return()=>{if(dialog.open)dialog.close();document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 return <dialog ref={ref} className={`dialog app-dialog ${wide?'dialog-wide':''}`} aria-labelledby={labelledBy} aria-describedby={describedBy} aria-busy={busy||undefined} onKeyDown={event=>{
  if(event.key!=='Tab')return;
  const dialog=event.currentTarget;
  const controls=Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(element=>element.tabIndex>=0&&element.getClientRects().length>0);
  const first=controls[0],last=controls[controls.length-1],active=document.activeElement;
  if(!first){event.preventDefault();dialog.focus();return;}
  if(!controls.includes(active as HTMLElement)){event.preventDefault();(event.shiftKey?last:first).focus();}
  else if(event.shiftKey&&active===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&active===last){event.preventDefault();first.focus();}
 }} onCancel={event=>{event.preventDefault();if(!busy)onClose();}} onClick={event=>{if(busy||event.target!==event.currentTarget)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}>{children}</dialog>;
}
