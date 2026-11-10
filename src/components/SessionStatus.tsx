'use client';
import { useAuth } from './AuthProvider';
import { Notice } from './Notice';
export default function SessionStatus(){const {user,error,refresh}=useAuth();return user?.accountStatus==='suspended'?<div className="container session-status"><p className="chat-unavailable" role="alert">Your account is suspended. Reason: {user.suspensionReason}. Protected actions are unavailable until an administrator restores the account.</p></div>:error?<div className="container session-status"><Notice message={error} onRetry={()=>void refresh()}/></div>:null;}
