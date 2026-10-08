import 'server-only';
import {getUser} from './auth';
import {CONTENT_API,FIREBASE_WEB_API_KEY} from './config';
import type {Post,Article} from './types';
import legacyPosts from '@/migration/public-posts.json';

export function hasLegacyPosts(owner:string){return legacyPosts.length>0&&legacyPosts.every(p=>p.owner===owner);}

type Value={stringValue?:string;integerValue?:string;nullValue?:null};
type Doc={name:string;fields:Record<string,Value>;updateTime:string};
type Stored=Post&{updateTime:string};
const root=CONTENT_API.replace('https://firestore.googleapis.com/v1/','');
const collection='hub4Posts';
const encode=(x:unknown):Value=>x==null?{nullValue:null}:typeof x==='number'?{integerValue:String(x)}:{stringValue:String(x)};
const fields=(x:Record<string,unknown>)=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,encode(v)]));
const decode=(d:Doc)=>Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,v.integerValue!==undefined?Number(v.integerValue):v.stringValue??null]));
class DBError extends Error{constructor(public status:number,message:string,public missingIndex=false){super(message);}}
export function storageErrorMessage(error:unknown){return error instanceof DBError?error.message:'저장소 연결을 확인한 뒤 다시 시도해 주세요.';}
async function call(path:string,token?:string,body?:unknown){
 const r=await fetch(CONTENT_API+path+('?key='+encodeURIComponent(FIREBASE_WEB_API_KEY)),{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(20000)});
 const raw=await r.json().catch(()=>null);const payload=Array.isArray(raw)?raw.find(x=>x?.error):raw;
 if(!r.ok||payload?.error){const error=payload?.error as {code?:number;status?:string;message?:string}|undefined;const code=error?.code||r.status;const status=path===':commit'&&error?.status==='FAILED_PRECONDITION'?409:code;const missingIndex=error?.status==='FAILED_PRECONDITION'&&/index/i.test(error.message||'');const messages:Record<number,string>={403:'Firebase가 공개 글 읽기를 거절했습니다. Firestore 규칙에서 hub4Posts의 published 글에 비로그인 조회를 허용해 주세요.',401:'로그인이 만료됐습니다. 다시 로그인해 주세요.',409:'다른 요청에서 글이 변경되었습니다. 새로고침 후 다시 시도해 주세요.',412:'다른 요청에서 글이 변경되었습니다. 새로고침 후 다시 시도해 주세요.'};console.error('[hub4:firestore]',{operation:path,status,code:error?.status,missingIndex});throw new DBError(status,messages[status]||'글 저장소 연결 실패 ('+code+').',missingIndex);}return raw;
}
async function identity(owner:string){const user=await getUser();if(!user||user.userId!==owner)throw new Error('내 글 관리 권한이 없습니다.');return user;}
async function doc(path:string,token?:string):Promise<Doc|null>{try{return await call('/'+path,token) as Doc;}catch(e){if(e instanceof DBError&&e.status===404)return null;throw e;}}
const write=(path:string,data:Record<string,unknown>,condition?:Record<string,unknown>)=>({update:{name:root+'/'+path,fields:fields(data)},...(condition?{currentDocument:condition}:{})});
function values(p:Post&{updateTime?:string}){const {review,updateTime,...data}=p;return data;}
async function indexedPosts(owner?:string,metadata=false):Promise<Stored[]>{
 const token=owner?(await identity(owner)).token:undefined;const output:Stored[]=[];let last:number|undefined;
 for(let page=0;page<50;page++){
  const filter={fieldFilter:{field:{fieldPath:owner?'owner':'status'},op:'EQUAL',value:{stringValue:owner||'published'}}};
  const rows=await call(':runQuery',token,{structuredQuery:{from:[{collectionId:collection}],...(metadata?{select:{fields:[{fieldPath:'id'},{fieldPath:'updated'}]}}:{}),where:filter,orderBy:[{field:{fieldPath:'id'},direction:'DESCENDING'}],limit:200,...(last!==undefined?{startAt:{values:[{integerValue:String(last)}],before:false}}:{})}}) as {document?:Doc}[];
  const docs=rows.filter(x=>x.document).map(x=>x.document!);for(const d of docs)output.push({...decode(d),review:null,updateTime:d.updateTime} as Stored);
  if(docs.length<200)return output;last=output[output.length-1].id;
 }throw new Error('조회 범위를 초과했습니다. 저장소 페이지 설정을 확인해 주세요.');
}
// Preserve the publication/owner constraint on every page; no private-data fallback.
async function unindexedPosts(owner?:string,metadata=false):Promise<Stored[]>{
 const token=owner?(await identity(owner)).token:undefined;const output:Stored[]=[];let last:string|undefined;
 for(let page=0;page<50;page++){
  const rows=await call(':runQuery',token,{structuredQuery:{from:[{collectionId:collection}],...(metadata?{select:{fields:[{fieldPath:'id'},{fieldPath:'updated'}]}}:{}),where:{fieldFilter:{field:{fieldPath:owner?'owner':'status'},op:'EQUAL',value:{stringValue:owner||'published'}}},limit:200,...(last?{startAt:{values:[{referenceValue:last}],before:false}}:{})}}) as {document?:Doc}[];
  const docs=rows.filter(x=>x.document).map(x=>x.document!);for(const d of docs)output.push({...decode(d),review:null,updateTime:d.updateTime} as Stored);
  if(docs.length<200)return output.sort((a,b)=>b.id-a.id);last=docs[docs.length-1].name;
 }throw new Error('조회 범위를 초과했습니다. 저장소 페이지 설정을 확인해 주세요.');
}
async function queryPosts(owner?:string,metadata=false):Promise<Stored[]>{
 try{return await indexedPosts(owner,metadata);}catch(error){if(!(error instanceof DBError&&error.missingIndex))throw error;return unindexedPosts(owner,metadata);}
}
export async function publicPosts(){return queryPosts(undefined,true);}
export async function listPosts(options:{owner?:string;theme?:string;q?:string;page?:number}={}){
 const page=Math.max(1,Math.floor(options.page||1));
 if(!options.owner&&!options.q){
  try{
  const status={fieldFilter:{field:{fieldPath:'status'},op:'EQUAL',value:{stringValue:'published'}}};
  const where=options.theme?{compositeFilter:{op:'AND',filters:[status,{fieldFilter:{field:{fieldPath:'theme'},op:'EQUAL',value:{stringValue:options.theme}}}]}}:status;
  const base={from:[{collectionId:collection}],where};
  const [rows,count]=await Promise.all([call(':runQuery',undefined,{structuredQuery:{...base,orderBy:[{field:{fieldPath:'id'},direction:'DESCENDING'}],limit:12,offset:(page-1)*12}}),call(':runAggregationQuery',undefined,{structuredAggregationQuery:{structuredQuery:base,aggregations:[{count:{},alias:'total'}]}})]);
  const docs=(rows as {document?:Doc}[]).filter(x=>x.document).map(x=>({...decode(x.document!),review:null,updateTime:x.document!.updateTime} as Stored));
  const total=Number((count as {result?:{aggregateFields?:{total?:Value}}}[])[0]?.result?.aggregateFields?.total?.integerValue||0);return {posts:docs,total,page};
  }catch(error){if(!(error instanceof DBError&&error.missingIndex))throw error;}
 }
 let posts=(await queryPosts(options.owner)).filter(p=>p.status!=='deleted');if(options.theme)posts=posts.filter(p=>p.theme===options.theme);if(options.q){const q=options.q.toLocaleLowerCase();posts=posts.filter(p=>(p.title+' '+p.description).toLocaleLowerCase().includes(q));}
 return {posts:posts.slice((page-1)*12,page*12),total:posts.length,page};
}
export async function getPost(id:number,owner?:string):Promise<Stored|null>{
 if(!Number.isSafeInteger(id)||id<1)return null;const token=owner?(await identity(owner)).token:undefined;let d:Doc|null;
 try{d=await doc(collection+'/'+id,token);}catch(e){if(!owner&&e instanceof DBError&&e.status===403)return null;throw e;}if(!d)return null;
 const p={...decode(d),review:null,updateTime:d.updateTime} as Stored;if(owner?(p.owner!==owner||p.status==='deleted'):p.status!=='published')return null;
 if(owner){const review=await doc(collection+'/'+id+'/private/review',token);p.review=review?String(decode(review).content):null;}return p;
}
export async function previousTitles(theme:string,owner:string){const all=[...await queryPosts(),...await queryPosts(owner)];return Array.from(new Map(all.filter(p=>p.theme===theme&&p.status!=='deleted').map(p=>[p.id,p])).values()).sort((a,b)=>b.id-a.id).slice(0,100).map(p=>({title:p.title}));}
export async function reservePost(owner:string,theme:string,title:string){
 const user=await identity(owner);for(let attempt=0;attempt<5;attempt++){
  const c=await doc('hub4Counters/posts',user.token);const id=c?Number(decode(c).nextId)+1:1;if(!Number.isSafeInteger(id)||id<1)throw new Error('글 번호 카운터가 올바르지 않습니다.');const now=new Date().toISOString();
  const post:Post={id,owner,theme,title,description:'',content:'',status:'reserved',created:now,updated:now,published:null,review:null,version:0};
  try{await call(':commit',user.token,{writes:[write('hub4Counters/posts',{nextId:id,updated:now},c?{updateTime:c.updateTime}:{exists:false}),write(collection+'/'+id,values(post),{exists:false})]});return id;}catch(e){if(!(e instanceof DBError&&[409,412].includes(e.status)))throw e;}
 }throw new Error('동시에 글 번호를 확보하는 요청이 많습니다. 다시 시도해 주세요.');
}
// One-time import under the original author's Firebase session. Never overwrite
// completed, edited, unpublished or deleted posts, and never remap their IDs.
export async function importLegacyPosts(owner:string){
 if(!hasLegacyPosts(owner))throw new Error('기존 글 작성자 계정으로 로그인해 주세요.');
 const user=await identity(owner);
 const rows=await call(':runQuery',user.token,{structuredQuery:{from:[{collectionId:collection}],where:{fieldFilter:{field:{fieldPath:'owner'},op:'EQUAL',value:{stringValue:owner}}}}}) as {document?:Doc}[];
 const existing=new Map(rows.filter(x=>x.document).map(x=>{const d=x.document!;const p={...decode(d),review:null,updateTime:d.updateTime} as Stored;return [p.id,p];}));
 const backup=[...legacyPosts].sort((a,b)=>a.id-b.id);
 // Preflight all conflicts before importing the first article.
 for(const row of backup){const p=existing.get(row.id);if(p&&(p.created!==row.created||p.theme!==row.theme||(p.version===0&&p.status!=='reserved')))throw new Error('기존 글과 번호가 충돌합니다. 저장된 글을 덮어쓰지 않았습니다. 번호 '+row.id);}
 let imported=0;let skipped=0;
 for(const row of backup){
  let p=existing.get(row.id);if(p&&p.version>=1){skipped++;continue;}
  if(!p){
   for(let attempt=0;attempt<5;attempt++){
    const counter=await doc('hub4Counters/posts',user.token);const next=counter?Number(decode(counter).nextId)+1:1;
    if(next!==row.id){
     // Another tab may have imported this ID while we were running.
     const current=await doc(collection+'/'+row.id,user.token);
     if(current){const q={...decode(current),review:null,updateTime:current.updateTime} as Stored;if(q.owner===owner&&q.created===row.created&&q.theme===row.theme){p=q;break;}}
     throw new Error('글 번호 카운터가 백업과 다릅니다. 기존 글은 덮어쓰지 않았습니다.');
    }
    const reserved:Post={id:row.id,owner,theme:row.theme,title:row.title,description:'',content:'',status:'reserved',created:row.created,updated:row.updated,published:null,review:null,version:0};
    try{const result=await call(':commit',user.token,{writes:[write('hub4Counters/posts',{nextId:row.id,updated:new Date().toISOString()},counter?{updateTime:counter.updateTime}:{exists:false}),write(collection+'/'+row.id,values(reserved),{exists:false})]}) as {writeResults:{updateTime:string}[]};p={...reserved,updateTime:result.writeResults[1].updateTime};break;}catch(error){if(!(error instanceof DBError&&[409,412].includes(error.status)))throw error;}
   }
  }
  if(!p)throw new Error('동시 이전 요청이 많습니다. 잠시 후 다시 시도해 주세요.');
  if(p.version>=1){skipped++;continue;}
  await updatePost(p,{title:row.title,description:row.description,content:JSON.stringify(row.article),status:'published',created:row.created,updated:row.updated,published:row.published,version:1});imported++;
 }
 return {imported,skipped,total:backup.length};
}
export async function updatePost(post:Stored,patch:Partial<Post>){const user=await identity(post.owner);const next={...post,...patch};const {updateTime,...p}=next;const result=await call(':commit',user.token,{writes:[write(collection+'/'+post.id,values(p),{updateTime:post.updateTime})]}) as {writeResults:{updateTime:string}[]};return {...next,updateTime:result.writeResults[0].updateTime};}
export async function saveReview(post:Stored,review:unknown){const user=await identity(post.owner);await call(':commit',user.token,{writes:[write(collection+'/'+post.id,values(post),{updateTime:post.updateTime}),write(collection+'/'+post.id+'/private/review',{content:JSON.stringify(review)})]});}
export async function listRevisions(id:number,owner:string){const user=await identity(owner);const rows=await call('/'+collection+'/'+id+':runQuery',user.token,{structuredQuery:{from:[{collectionId:'revisions'}],orderBy:[{field:{fieldPath:'version'},direction:'DESCENDING'}]}}) as {document?:Doc}[];return rows.filter(x=>x.document).map(x=>decode(x.document!)) as {id:number;created:string;version:number;content:string}[];}
export async function getRevision(id:number,revision:number,owner:string){if(!Number.isSafeInteger(revision)||revision<1)return null;const user=await identity(owner);const d=await doc(collection+'/'+id+'/revisions/'+revision,user.token);return d?decode(d) as {content:string}:null;}
export async function revisePost(post:Stored,article:Article){
 const user=await identity(post.owner);const now=new Date().toISOString();await call(':commit',user.token,{writes:[write(collection+'/'+post.id+'/revisions/'+post.version,{id:post.version,version:post.version,owner:post.owner,content:post.content,title:post.title,description:post.description,created:now},{exists:false}),write(collection+'/'+post.id,values({...post,title:article.title,description:article.description,content:JSON.stringify(article),updated:now,version:post.version+1,review:null}),{updateTime:post.updateTime}),{delete:root+'/'+collection+'/'+post.id+'/private/review'}]});
}
