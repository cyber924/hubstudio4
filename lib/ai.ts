import type {Article,ImageAsset} from './types';
export async function ai(prompt:string,key?:string,images:ImageAsset[]=[]){
 const k=process.env.GEMINI_API_KEY||key;
 if(!k)throw new Error('Gemini API 키를 입력해 주세요. 입력한 키는 저장하지 않습니다.');
 const parts:unknown[]=[{text:prompt}];
 for(const a of images){if(a.data?.startsWith('data:image/')){const m=a.data.match(/^data:([^;]+);base64,([\s\S]+)$/);if(m){parts.push({text:'다음 사진 ID: '+a.id});parts.push({inlineData:{mimeType:m[1],data:m[2]}});}}}
 const model=process.env.GEMINI_MODEL||'gemini-2.5-flash';
 const r=await fetch('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':k},body:JSON.stringify({contents:[{parts}],generationConfig:{responseMimeType:'application/json',temperature:0.65}}),signal:AbortSignal.timeout(120000)});
 const d=await r.json() as {candidates?:{content?:{parts?:{text?:string}[]}}[];error?:{message?:string}};
 if(!r.ok)throw new Error(r.status===429?'Gemini 요청 한도에 도달했습니다. 잠시 후 다시 시도하세요.':'Gemini 응답 오류 ('+r.status+'). API 키와 모델 사용 권한을 확인해 주세요.');
 const raw=d.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('');if(!raw)throw new Error('AI가 내용을 반환하지 않았습니다. 다시 시도해 주세요.');
 try{return JSON.parse(raw.replace(/^```json\s*|```$/g,'')) as Record<string,unknown>;}catch{throw new Error('AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.');}
}
export function validateArticle(v:unknown,available:ImageAsset[],count?:number):Article{
 const a=v as Article;if(!a||typeof a.title!=='string'||!a.title.trim()||typeof a.description!=='string'||!a.description.trim()||typeof a.intro!=='string'||typeof a.summary!=='string'||!Array.isArray(a.tags)||!a.tags.every(t=>typeof t==='string')||!Array.isArray(a.sections))throw new Error('생성된 글에 필수 내용이 빠져 있습니다.');
 const ids=new Set(available.map(x=>x.id));const used=new Set<string>();
 for(const s of a.sections){if(typeof s.heading!=='string'||!s.heading.trim()||typeof s.caption!=='string'||!Array.isArray(s.paragraphs)||!s.paragraphs.length||!s.paragraphs.every(p=>typeof p==='string'&&p.trim())||!ids.has(s.imageId))throw new Error('본문 또는 이미지 연결이 올바르지 않습니다.');used.add(s.imageId);}
 if(used.size<2||used.size>5||(count&&used.size!==count))throw new Error('선택한 이미지 수와 생성된 글이 일치하지 않습니다.');return a;
}
export const articleFormat='{"title":"제목","description":"검색 설명","intro":"도입","sections":[{"heading":"소제목","paragraphs":["문단","문단"],"imageId":"제공된 ID","caption":"사실에 맞는 사진 설명"}],"summary":"마무리 요약","tags":["키워드"]}';
