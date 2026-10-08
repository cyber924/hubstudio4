import type {MetadataRoute} from 'next';
import {publicPosts} from '@/lib/store';
import {ORIGIN} from '@/lib/config';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const posts=await publicPosts();return [{url:ORIGIN+'/',changeFrequency:'daily',priority:1},{url:ORIGIN+'/blog',changeFrequency:'daily',priority:0.9},...posts.map(p=>({url:ORIGIN+'/blog/'+p.id,lastModified:p.updated,changeFrequency:'weekly' as const,priority:0.8}))];}
