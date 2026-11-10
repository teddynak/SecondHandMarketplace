import {Suspense} from 'react';
import AccountLinkForm from '@/components/AccountLinkForm';
export const metadata={title:'Verify your email',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Page(){return <Suspense fallback={<div className="container page-loading">Loading…</div>}><AccountLinkForm kind="verify"/></Suspense>;}
