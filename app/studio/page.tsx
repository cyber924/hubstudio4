import {getUser,loginPath} from '@/lib/auth';
import {Studio} from '@/components/studio';
export const dynamic='force-dynamic';
export const metadata={title:'제작 스튜디오',robots:{index:false,follow:false}};
export default async function Page(){const user=await getUser();return <main className="shell workspace"><div className="workspace-title"><div><span className="eyebrow">CREATION STUDIO</span><h1>다음 이야기를 만들어볼까요?</h1><p>테마에서 시작해 이미지 선택과 글 발행까지, 한 번에.</p></div><a className="text-link" href="/my">내 글 관리</a></div>{user?<Studio configured={!!process.env.GEMINI_API_KEY}/>:<div className="login-panel"><span className="empty-symbol">✦</span><h2>이야기를 만들려면 로그인해 주세요.</h2><p>공개 웹진은 누구나 읽을 수 있습니다.<br/>제작과 내 글 관리는 로그인 후 이용할 수 있습니다.</p><a className="button blue" href={loginPath('/studio')} target="_top">이메일로 로그인</a></div>}</main>;}
