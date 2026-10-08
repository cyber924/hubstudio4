import {sameOrigin} from '@/lib/request';
import {getUser} from '@/lib/auth';
import {getPost,previousTitles,reservePost,updatePost,saveReview,getRevision,revisePost} from '@/lib/store';
export const runtime='nodejs';
export const maxDuration=300;
import {catalog,imageById} from '@/lib/hub';
import {ai,articleFormat,validateArticle} from '@/lib/ai';
import {THEMES,themeName,type Article,type ImageAsset,type Review} from '@/lib/types';

export async function POST(req:Request){
 if(!sameOrigin(req))return Response.json({error:'허용되지 않은 요청입니다.'},{status:403});
 const user=await getUser();if(!user)return Response.json({error:'제작과 관리는 로그인이 필요합니다.'},{status:401});
 let body:Record<string,unknown>;try{body=await req.json();}catch{return Response.json({error:'요청 형식 오류'},{status:400});}
 const action=String(body.action||'');const key=typeof body.key==='string'?body.key:undefined;const now=new Date().toISOString();let workingPost:Awaited<ReturnType<typeof getPost>>=null;
 try{
 if(action==='topics'){
  const theme=String(body.theme);if(!THEMES.some(t=>t.id===theme))throw new Error('테마를 선택해 주세요.');
  const images=await catalog();if(images.length<2)throw new Error('공개 이미지가 2개 이상 필요합니다. 이미지허브에서 공개 설정을 확인해 주세요.');
  const prev=await previousTitles(theme,user.userId);
  const result=await ai('한국어 전문 블로그 편집자. 테마 '+themeName(theme)+'. 다음 공개 이미지 자산으로 구성 가능한 서로 다른 주제 5개를 추천. 이미지에 없는 특정 장소나 제품은 추측하지 않는다. 기존 글과 중복을 피한다. 확인되지 않은 가격·운영시간·순위·최신 소식은 만들지 않는다. 사용자 관심: '+String(body.interest||'').slice(0,300)+'\n기존 제목:'+JSON.stringify(prev)+'\n전체 이미지 메타데이터:'+JSON.stringify(images.map(({data,url,...x})=>x))+'\nJSON 형식 {"topics":[{"title":"제목","description":"추천 이유","keywords":["검색어"]}]}',key);
  const topics=result.topics as {title:string;description:string;keywords:string[]}[];if(!Array.isArray(topics)||topics.length!==5||!topics.every(t=>typeof t.title==='string'&&typeof t.description==='string'&&Array.isArray(t.keywords)))throw new Error('주제 추천 결과 형식이 올바르지 않습니다.');return Response.json({topics});
 }
 if(action==='reserve'){
  const theme=String(body.theme);if(!THEMES.some(t=>t.id===theme))throw new Error('테마를 선택해 주세요.');
  const title=String(body.title||'').trim().slice(0,180);if(!title)throw new Error('생성할 주제를 선택해 주세요.');
  return Response.json({id:await reservePost(user.userId,theme,title)});
 }
 const id=Number(body.id);if(!Number.isSafeInteger(id)||id<1)throw new Error('글 번호가 올바르지 않습니다.');
 let post=await getPost(id,user.userId);if(!post)return Response.json({error:'글을 찾을 수 없거나 관리 권한이 없습니다.'},{status:404});
 if(action==='generate'){
  if(post.status==='published')return Response.json({id,alreadyPublished:true});
  if(!['reserved','failed'].includes(post.status))throw new Error('이 글은 현재 처리 중이거나 생성이 완료됐습니다.');
  const count=Number(body.count);if(![2,3,4,5].includes(count))throw new Error('이미지 수는 2~5개입니다.');
  post=await updatePost(post,{status:'generating',updated:now});workingPost=post;
  const images=await catalog();if(images.length<count)throw new Error('공개 이미지 수가 부족합니다. 이미지 수를 줄이거나 이미지허브에서 공개해 주세요.');
  const select=await ai('주제에 정확히 맞는 이미지 '+count+'개를 다음 전체 이미지허브 자산 중 선택. 중복 없이 실제 ID 사용. 관련성이 낮으면 억지로 선택하지 말고 {"error":"적합한 이미지가 부족합니다"} 반환. 제목:'+post.title+'\n'+JSON.stringify(images.map(({data,url,...x})=>x))+'\nJSON {"imageIds":["id"]}',key);
  if(select.error)throw new Error(String(select.error));const ids=select.imageIds as string[];if(!Array.isArray(ids)||new Set(ids).size!==count||!ids.every(x=>images.some(a=>a.id===x)))throw new Error('주제에 맞는 이미지 '+count+'개를 선택하지 못했습니다.');
  const assets=(await Promise.all(ids.map(imageById))).filter((x):x is ImageAsset=>!!x);if(assets.length!==count)throw new Error('선택한 이미지 중 공개 상태가 변경되거나 사용할 수 없는 이미지가 있습니다.');
  const result=await ai('한국어 전문 웹진 글을 작성. 주제:'+post.title+'\n테마:'+themeName(post.theme)+'\n문체:'+String(body.tone||'친근한 정보형')+'\n추가 요청:'+String(body.directions||'').slice(0,600)+'\n이미지:'+JSON.stringify(assets.map(({data,url,...x})=>x))+'\n각 이미지에 한 섹션을 배정하고 총 '+count+'개 섹션, 섹션마다 2~3개의 충분한 문단. 사진에 실제 보이는 내용에 맞춰 글을 구성. 이미지와 관계없는 장소명·가격·운영시간·통계·최신사실·직접 체험을 지어내지 않는다. 사실 확인이 필요한 내용은 독자가 확인할 방법을 설명한다. 외부 출처 URL을 만들지 않는다. 제목 45자 이내, description 80~140자, 전체 1200~2000자. Markdown·HTML을 넣지 말고 순수 텍스트. 정확한 JSON:'+articleFormat,key,assets);
  const article=validateArticle(result,assets,count);await updatePost(post,{title:article.title,description:article.description,content:JSON.stringify(article),status:'published',published:new Date().toISOString(),updated:new Date().toISOString(),version:1});workingPost=null;return Response.json({id,title:article.title});
 }
 if(action==='review'){
  if(!['published','draft'].includes(post.status))throw new Error('완성된 글만 검수할 수 있습니다.');
  const article=JSON.parse(post.content) as Article;const assets=(await Promise.all([...new Set(article.sections.map(s=>s.imageId))].map(imageById))).filter((x):x is ImageAsset=>!!x);if(assets.length<2)throw new Error('이미지를 불러오지 못해 검수하지 않았습니다.');
  const result=await ai('이 글을 한국어로 검수. 사진과 본문 부합, 문장 흐름, 확인되지 않은 사실, 중복 점검. 실제 사진을 확인한 범위만 판단. 외부 검색으로 사실을 검증했다고 주장하지 않는다. 문제 없으면 findings는 빈 배열. 사진 ID를 바꾸지 않는다. 결과 JSON {"score":0~100,"findings":[{"severity":"high|medium|low","section":1,"message":"문제","suggestion":"수정안"}],"revised":'+articleFormat+'}. 글:'+JSON.stringify(article),key,assets);
  validateArticle(result.revised,assets);if(typeof result.score!=='number'||!Array.isArray(result.findings))throw new Error('검수 결과 형식 오류');
  const review={...result,visualChecked:assets.every(x=>x.data?.startsWith('data:image/')),baseVersion:post.version};await saveReview(post,review);return Response.json({review});
 }
 if(action==='apply'||action==='edit'||action==='restore'){
  if(!['published','draft'].includes(post.status))throw new Error('완성된 글만 수정할 수 있습니다.');let article:Article;
  if(action==='apply'){if(!post.review)throw new Error('먼저 AI 검수를 실행해 주세요.');const r=JSON.parse(post.review) as Review&{baseVersion:number};if(r.baseVersion!==post.version)throw new Error('검수 후 글이 변경되었습니다. 다시 검수해 주세요.');article=r.revised;}
  else if(action==='restore'){const rev=await getRevision(id,Number(body.revisionId),user.userId);if(!rev)throw new Error('이전 버전을 찾을 수 없습니다.');article=JSON.parse(rev.content);}
  else {if(Number(body.version)!==post.version)throw new Error('다른 화면에서 글이 수정됐습니다. 새로고침 후 다시 저장해 주세요.');article=body.article as Article;}
  const meta=await catalog();validateArticle(article,meta);
  await revisePost(post,article);return Response.json({ok:true});
 }
 if(action==='publish'||action==='unpublish'||action==='delete'){
  if(action!=='delete'&&!['published','draft'].includes(post.status))throw new Error('완성된 글만 발행 상태를 변경할 수 있습니다.');const status=action==='publish'?'published':action==='unpublish'?'draft':'deleted';
  await updatePost(post,{status,updated:now,published:status==='published'?(post.published||now):post.published});return Response.json({ok:true});
 }
 return Response.json({error:'지원하지 않는 작업입니다.'},{status:400});
 }catch(e){if(workingPost)await updatePost(workingPost,{status:'failed',updated:new Date().toISOString()}).catch(()=>{});console.error('Hub Studio action failed',action,(e as Error).message);return Response.json({error:(e as Error).message||'처리에 실패했습니다.'},{status:action==='generate'||action==='review'||action==='topics'?502:400});}
}
