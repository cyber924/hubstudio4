'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="shell"><div className="error-panel"><h1>일시적으로 불러오지 못했습니다.</h1><p>글이 삭제된 것은 아닙니다. 잠시 후 다시 시도해 주세요.</p><button className="button" onClick={reset}>다시 시도</button></div></main>;}
