// Next.js는 프록시 뒤에서 req.url에 내부 호스트를 사용할 수 있습니다.
// 브라우저가 변경할 수 없는 실제 Host와 Origin을 비교합니다.
export function sameOrigin(req:Request){
 const origin=req.headers.get('origin');if(!origin)return false;
 try{const source=new URL(origin);const host=req.headers.get('host')||new URL(req.url).host;if(source.host!==host)return false;return source.protocol==='https:'||(source.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(source.hostname));}catch{return false;}
}
