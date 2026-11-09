import Link from 'next/link';
import { ArrowRight, PackageOpen } from 'lucide-react';
export default function EmptyState({ title = 'Nothing here just yet', description = 'Be the first to list something worth reusing.', action = true }: { title?: string; description?: string; action?: boolean }) {
 return <div className="empty-state"><div className="empty-icon"><PackageOpen size={34}/></div><h3>{title}</h3><p>{description}</p>{action && <Link href="/sell" className="btn btn-primary">List an item <ArrowRight size={17}/></Link>}</div>;
}
