import type {MetadataRoute} from 'next';
import {ORIGIN} from '@/lib/config';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:['/','/blog/','/api/hub/'],disallow:['/studio','/my','/api/action','/api/auth','/login']},sitemap:ORIGIN+'/sitemap.xml'};}
