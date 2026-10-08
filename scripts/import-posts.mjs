import {readFile} from 'node:fs/promises';
import readline from 'node:readline';
const project=process.env.FIREBASE_PROJECT_ID||'studio-9240700230-1dd9a';
const key=process.env.FIREBASE_API_KEY||'AIzaSyDEpFAsf1fI65xXklKYsukAWFYw5bzaHyc';
const base='https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents';
const nameRoot=base.replace('https://firestore.googleapis.com/v1/','');
const question=(text,secret=false)=>new Promise(resolve=>{const rl=readline.createInterface({input:process.stdin,output:process.stdout,terminal:!!process.stdin.isTTY});let hide=false;const original=rl._writeToOutput?.bind(rl);if(secret&&original)rl._writeToOutput=t=>{if(!hide)original(t);};rl.question(text,value=>{hide=false;rl.close();if(secret)process.stdout.write('\n');resolve(value);});hide=secret;});
const email=process.env.MIGRATION_EMAIL||await question('기존 작성자 Firebase 이메일: ');
const password=process.env.MIGRATION_PASSWORD||await question('비밀번호 (입력 숨김): ',true);
const auth=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='+encodeURIComponent(key),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});
const account=await auth.json();if(!auth.ok||!account.idToken)throw new Error('Firebase 로그인 실패. 이메일과 비밀번호를 확인해 주세요.');
const token=account.idToken;
const rows=JSON.parse(await readFile(new URL('../migration/public-posts.json',import.meta.url),'utf8'));
if(rows.some(p=>p.owner!==account.localId))throw new Error('백업 글의 기존 작성자 계정으로 로그인해야 합니다. UID를 변경하지 않습니다.');
const fields=data=>Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v==null?{nullValue:null}:typeof v==='number'?{integerValue:String(v)}:{stringValue:String(v)}]));
const write=(path,data,precondition)=>({update:{name:nameRoot+'/'+path,fields:fields(data)},...(precondition?{currentDocument:precondition}:{})});
async function request(path,body){const r=await fetch(base+path+'?key='+encodeURIComponent(key),{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body?JSON.stringify(body):undefined});if(r.status===404)return null;const d=await r.json();if(!r.ok)throw new Error('데이터 이전 실패 ('+r.status+'). Firestore 규칙을 확인하세요.');return d;}
const own=await request(':runQuery',{structuredQuery:{from:[{collectionId:'hub4Posts'}],where:{fieldFilter:{field:{fieldPath:'owner'},op:'EQUAL',value:{stringValue:account.localId}}}}});
const existing=new Map(own.filter(x=>x.document).map(x=>[Number(x.document.fields.id.integerValue),x.document]));
let counter=await request('/hub4Counters/posts');
for(const row of rows.sort((a,b)=>a.id-b.id)){
 let post=existing.get(row.id);
 if(post?.fields.status.stringValue==='published'){
  if(post.fields.content.stringValue!==JSON.stringify(row.article))throw new Error('이미 있는 글의 내용이 백업과 달라 덮어쓰지 않습니다. 번호 '+row.id);
  console.log('이미 이전됨:',row.id);continue;
 }
 if(post&&post.fields.status.stringValue!=='reserved')throw new Error('번호 충돌이 있어 중단합니다. 번호 '+row.id);
 if(!post){const next=counter?Number(counter.fields.nextId.integerValue)+1:1;if(next!==row.id)throw new Error('번호 카운터가 백업과 다릅니다. 빈 허브스튜디오4 컬렉션에만 이전하세요.');
  const reserved={id:row.id,owner:row.owner,theme:row.theme,title:row.title,description:'',content:'',status:'reserved',created:row.created,updated:row.updated,published:null,version:0};
  await request(':commit',{writes:[write('hub4Counters/posts',{nextId:row.id,updated:new Date().toISOString()},counter?{updateTime:counter.updateTime}:{exists:false}),write('hub4Posts/'+row.id,reserved,{exists:false})]});
  counter=await request('/hub4Counters/posts');post=await request('/hub4Posts/'+row.id);
 }
 const data={id:row.id,owner:row.owner,theme:row.theme,title:row.article.title,description:row.article.description,content:JSON.stringify(row.article),status:'published',created:row.created,updated:row.updated,published:row.published,version:1};
 await request(':commit',{writes:[write('hub4Posts/'+row.id,data,{updateTime:post.updateTime})]});console.log('공개 글 이전 완료:',row.id);
}
console.log('완료. 공개 주소 /blog/{id}는 유지됩니다. 검수 결과와 과거 수정 이력은 이 공개 백업에 포함되지 않습니다.');
