import {Webzine} from '@/components/webzine';
export const dynamic='force-dynamic';
export const metadata={title:'공개 웹진',description:'여행, 맛집, 생활과 취향의 이야기를 읽는 허브스튜디오4 공개 웹진.',alternates:{canonical:'/blog'}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){return <Webzine params={await searchParams}/>;}
