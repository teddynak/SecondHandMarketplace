import type {MetadataRoute} from 'next';
import {siteOrigin} from '@/lib/seo';
export const dynamic='force-dynamic';
export default function robots():MetadataRoute.Robots{
 const origin=siteOrigin();if(!origin)return {rules:{userAgent:'*',disallow:'/'}};
 return {rules:{userAgent:'*',allow:['/','/api/images/'],disallow:['/api/','/admin','/account/','/dashboard','/inbox','/notifications','/saved','/sell','/login','/register','/forgot-password','/reset-password','/verify-email']},sitemap:`${origin}/sitemap.xml`};
}
