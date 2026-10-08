import {Webzine} from '@/components/webzine';
export const dynamic='force-dynamic';
export const metadata={alternates:{canonical:'/'}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){return <Webzine params={await searchParams} home/>;}
