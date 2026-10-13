import {Webzine} from '@/components/webzine';
export const dynamic='force-dynamic';
export const metadata={title:'공개 웹진',description:'여행, 맛집, 생활과 취향의 이야기를 읽는 허브클라우드 공개 웹진.',alternates:{canonical:'/blog'},openGraph:{type:'website',url:'/blog',siteName:'허브클라우드',title:'공개 웹진 | 허브클라우드',description:'여행, 맛집, 생활과 취향의 이야기를 읽는 허브클라우드 공개 웹진.'}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){return <Webzine params={await searchParams}/>;}
