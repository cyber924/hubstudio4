'use client';
import {useState} from 'react';
export function Logout(){const [busy,setBusy]=useState(false);const [error,setError]=useState('');return <><button className="text-link" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'logout'})});if(!r.ok)throw new Error();window.location.href='/';}catch{setError('다시 시도해 주세요.');setBusy(false);}}}>{busy?'처리 중':'로그아웃'}</button>{error&&<small role="alert">{error}</small>}</>;}
