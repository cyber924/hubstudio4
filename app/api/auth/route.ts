import {sameOrigin} from '@/lib/request';
import {cookies} from 'next/headers';
import {firebaseAuth,ID_COOKIE,REFRESH_COOKIE} from '@/lib/auth';
export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
 try{
  const b=await req.json() as {action:string;email?:string;password?:string;confirm?:string};const jar=await cookies();const opts={httpOnly:true,secure:true,sameSite:'lax' as const,path:'/'};
  if(b.action==='logout'){jar.set(ID_COOKIE,'',{...opts,maxAge:0});jar.set(REFRESH_COOKIE,'',{...opts,maxAge:0});return Response.json({ok:true});}
  if(!['login','signup','reset'].includes(b.action))return Response.json({error:'잘못된 요청입니다.'},{status:400});
  const email=String(b.email||'').trim();if(!email||email.length>254||!email.includes('@'))throw new Error('이메일을 입력해 주세요.');
  if(b.action==='reset'){try{await firebaseAuth('sendOobCode',{requestType:'PASSWORD_RESET',email});}catch(e){if((e as Error&{code?:string}).code!=='EMAIL_NOT_FOUND')throw e;}return Response.json({ok:true,message:'가입된 이메일이면 비밀번호 재설정 메일이 전송됩니다.'});}
  const password=String(b.password||'');if(password.length<6||password.length>4096)throw new Error('비밀번호는 6자 이상 입력해 주세요.');if(b.action==='signup'&&password!==b.confirm)throw new Error('비밀번호 확인이 일치하지 않습니다.');
  const d=await firebaseAuth(b.action==='signup'?'signUp':'signInWithPassword',{email,password,returnSecureToken:true});if(!d.idToken||!d.refreshToken)throw new Error('인증 응답을 확인하지 못했습니다.');
  jar.set(ID_COOKIE,d.idToken,{...opts,maxAge:Math.min(Number(d.expiresIn)||3600,3600)});jar.set(REFRESH_COOKIE,d.refreshToken,{...opts,maxAge:60*60*24*30});return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:(e as Error).message||'로그인에 실패했습니다.'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
