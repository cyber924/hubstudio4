import {Login} from '@/components/login';
import {getUser,safeReturnPath} from '@/lib/auth';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export const metadata={title:'로그인 · 회원가입',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){const p=await searchParams;const next=safeReturnPath(p.next);if(await getUser())redirect(next);return <main className="shell auth-layout"><Login next={next}/></main>;}
