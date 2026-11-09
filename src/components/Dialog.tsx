'use client';
import { useEffect,useRef } from 'react';
/** Native modal provides focus containment, an inert background and focus restoration. */
export default function Dialog({children,labelledBy,describedBy,onClose,busy=false,wide=false}:{children:React.ReactNode;labelledBy:string;describedBy?:string;onClose:()=>void;busy?:boolean;wide?:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;if(!dialog)return;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';if(!dialog.open)dialog.showModal();dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();return()=>{if(dialog.open)dialog.close();document.body.style.overflow=overflow;};},[]);
 return <dialog ref={ref} className={`dialog app-dialog ${wide?'dialog-wide':''}`} aria-labelledby={labelledBy} aria-describedby={describedBy} aria-busy={busy||undefined} onCancel={event=>{event.preventDefault();if(!busy)onClose();}} onClick={event=>{if(busy||event.target!==event.currentTarget)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)onClose();}}>{children}</dialog>;
}
