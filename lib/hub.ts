import {HUB_API} from './config';
import type {ImageAsset} from './types';
type FV={stringValue?:string;integerValue?:string;booleanValue?:boolean;arrayValue?:{values?:FV[]};mapValue?:{fields?:Record<string,FV>}};
function val(v:FV|undefined):unknown {if(!v)return null;if(v.stringValue!==undefined)return v.stringValue;if(v.booleanValue!==undefined)return v.booleanValue;if(v.arrayValue)return(v.arrayValue.values||[]).map(val);if(v.mapValue)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,val(x)]));return v.integerValue;}
function asset(d:{name:string;fields:Record<string,FV>},metadata=false):ImageAsset|null{
 const x=Object.fromEntries(Object.entries(d.fields||{}).map(([k,v])=>[k,val(v)]));
 if(x.visibility!=='public')return null;
 const id=d.name.split('/').pop()!;const src=String(x.dataUrl||x.imageUrl||x.url||'');
 if(!metadata&&!src.startsWith('data:image/')&&!src.startsWith('https://'))return null;
 return {id,title:String(x.title||x.destination||'이미지허브 자산'),tags:Array.isArray(x.tags)?x.tags.map(String):[],prompt:String(x.prompt||''),ratio:String(x.ratio||x.aspectRatio||'16:9'),url:'/api/hub/'+encodeURIComponent(id),data:src};
}
export async function catalog(){let token='';const out:ImageAsset[]=[];let pages=0;
 const mask=['visibility','title','destination','tags','prompt','ratio','aspectRatio'].map(x=>'&mask.fieldPaths='+x).join('');
 do{const r=await fetch(HUB_API+'/images?pageSize=100'+mask+(token?'&pageToken='+encodeURIComponent(token):''),{cache:'no-store'});if(!r.ok)throw new Error('이미지허브 조회 실패 ('+r.status+'). 공개 읽기 권한을 확인해 주세요.');const d=await r.json() as {documents?:{name:string;fields:Record<string,FV>}[];nextPageToken?:string};for(const doc of d.documents||[]){const a=asset(doc,true);if(a)out.push(a);}token=d.nextPageToken||'';if(++pages>100)throw new Error('이미지허브 조회 범위를 초과했습니다.');}while(token);return out;
}
export async function imageById(id:string){const r=await fetch(HUB_API+'/images/'+encodeURIComponent(id),{cache:'no-store'});if(r.status===404)return null;if(!r.ok)throw new Error('이미지 조회에 실패했습니다.');return asset(await r.json() as {name:string;fields:Record<string,FV>});}
