import {cookies} from 'next/headers';
import {cache} from 'react';
import {FIREBASE_WEB_API_KEY} from './config';

export const ID_COOKIE='__Host-hub4_id';
export const REFRESH_COOKIE='__Host-hub4_refresh';
export function authKey(){const key=FIREBASE_WEB_API_KEY;if(!key)throw new Error('Firebase 로그인 연결 설정이 필요합니다.');return key;}
export function safeReturnPath(path?:string){try{if(!path?.startsWith('/'))return '/studio';const u=new URL(path,'https://app.local');if(u.origin!=='https://app.local'||u.pathname==='/login'||u.pathname.startsWith('/api/'))return '/studio';return u.pathname+u.search+u.hash;}catch{return '/studio';}}
export function loginPath(path='/studio'){return '/login?next='+encodeURIComponent(safeReturnPath(path));}
export async function firebaseAuth(method:string,body:Record<string,unknown>){
 const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+method+'?key='+encodeURIComponent(authKey()),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(15000)});
 const d=await r.json() as any;if(!r.ok){const code=String(d.error?.message||'');const errors:Record<string,string>={EMAIL_EXISTS:'이미 가입된 이메일입니다. 로그인해 주세요.',INVALID_LOGIN_CREDENTIALS:'이메일 또는 비밀번호를 확인해 주세요.',EMAIL_NOT_FOUND:'이메일 또는 비밀번호를 확인해 주세요.',INVALID_PASSWORD:'이메일 또는 비밀번호를 확인해 주세요.',OPERATION_NOT_ALLOWED:'Firebase에서 이메일·비밀번호 로그인을 활성화해 주세요.',USER_DISABLED:'사용이 중지된 계정입니다.',TOO_MANY_ATTEMPTS_TRY_LATER:'요청이 많습니다. 잠시 후 다시 시도해 주세요.',INVALID_EMAIL:'이메일 형식을 확인해 주세요.'};const error=new Error(errors[code]||(code.startsWith('WEAK_PASSWORD')?'비밀번호는 6자 이상 입력해 주세요.':'Firebase 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.')) as Error&{code:string};error.code=code;throw error;}return d;
}
export const getUser=cache(async()=>{
 const jar=await cookies();let token=jar.get(ID_COOKIE)?.value;const refresh=jar.get(REFRESH_COOKIE)?.value;if(!token&&!refresh)return null;
 try{
  if(token){try{const d=await firebaseAuth('lookup',{idToken:token});const u=d.users?.[0];if(u?.localId&&u.email&&!u.disabled)return {userId:u.localId as string,email:u.email as string,fullName:(u.displayName||null) as string|null,token:token as string};}catch{}}
  if(!refresh)return null;
  const r=await fetch('https://securetoken.googleapis.com/v1/token?key='+encodeURIComponent(authKey()),{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:refresh}),cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)return null;
  const d=await r.json() as {id_token?:string;project_id?:string};if(!d.id_token)return null;
  const account=await firebaseAuth('lookup',{idToken:d.id_token});const u=account.users?.[0];return u?.localId&&u.email&&!u.disabled?{userId:u.localId as string,email:u.email as string,fullName:(u.displayName||null) as string|null,token:d.id_token}:null;
 }catch{return null;}
});
