import type {Metadata} from 'next';
export const metadata:Metadata={title:'Your inbox',robots:{index:false,follow:false}};
export default function InboxLayout({children}:{children:React.ReactNode}){return children;}
