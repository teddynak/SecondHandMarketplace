import { AlertCircle } from 'lucide-react';
export function Notice({ message }: { message: string }) { return <div className="notice"><AlertCircle size={19} /><span>{message}</span></div>; }
