'use client';
import { useAuth } from './AuthProvider';
import { Notice } from './Notice';
export default function SessionStatus(){const {error,refresh}=useAuth();return error?<div className="container session-status"><Notice message={error} onRetry={()=>void refresh()}/></div>:null;}
