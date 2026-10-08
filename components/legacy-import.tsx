'use client';
import {useEffect,useRef,useState} from 'react';

export function LegacyImport({owner}:{owner:string}){
 const started=useRef(false);const [error,setError]=useState('');const [busy,setBusy]=useState(true);
 async function migrate(){
  setBusy(true);setError('');
  try{
   const response=await fetch('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'importLegacy'})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'기존 글을 가져오지 못했습니다.');
   try{sessionStorage.setItem('hub4-import-v1:'+owner,'done');}catch{}
   if(data.imported>0)window.location.reload();
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 useEffect(()=>{
  if(started.current)return;started.current=true;
  try{if(sessionStorage.getItem('hub4-import-v1:'+owner)==='done'){setBusy(false);return;}}catch{}
  void migrate();
 },[owner]);
 if(!busy&&!error)return null;
 return <div role="status" className="helper">{busy?'기존 글 3개를 가져오는 중…':<>{error} <button className="text-link" onClick={()=>void migrate()}>다시 가져오기</button></>}</div>;
}
