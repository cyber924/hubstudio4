import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getPost,listPosts} from '@/lib/store';
import {ORIGIN} from '@/lib/config';
import {themeName,type Article} from '@/lib/types';
import {PostCard} from '@/components/cards';
import './editorial.css';
export const dynamic='force-dynamic';
async function find(id:string){if(!/^[1-9]\d*$/.test(id))return null;return getPost(Number(id));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const p=await find(id);if(!p)return {title:'글을 찾을 수 없습니다',robots:{index:false,follow:true}};const a=JSON.parse(p.content) as Article;const url=ORIGIN+'/blog/'+p.id;const image=ORIGIN+'/api/hub/'+encodeURIComponent(a.sections[0].imageId);return {title:p.title,description:p.description,alternates:{canonical:url},openGraph:{type:'article',title:p.title,description:p.description,url,images:[{url:image,alt:a.sections[0].caption}],publishedTime:p.published||p.created,modifiedTime:p.updated},twitter:{card:'summary_large_image',title:p.title,description:p.description,images:[image]}};}
export default async function Detail({params}:{params:Promise<{id:string}>}){const p=await find((await params).id);if(!p)notFound();const a=JSON.parse(p.content) as Article;const related=(await listPosts({theme:p.theme})).posts.filter(x=>x.id!==p.id).slice(0,5);const first=a.sections[0];const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:p.title,description:p.description,image:a.sections.map(s=>ORIGIN+'/api/hub/'+encodeURIComponent(s.imageId)),datePublished:p.published||p.created,dateModified:p.updated,author:{'@type':'Organization',name:'허브클라우드'},publisher:{'@type':'Organization',name:'허브클라우드',url:ORIGIN},mainEntityOfPage:{'@type':'WebPage','@id':ORIGIN+'/blog/'+p.id}};
 return <main className="article-shell article-shell--premium"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/><div className="breadcrumbs"><a href="/blog">공개 웹진</a><span>/</span><a href={'/blog?theme='+p.theme}>{themeName(p.theme)}</a><span>/</span><span>NO. {String(p.id).padStart(3,'0')}</span></div><div className="article-reading-grid"><div className="article-reading-main"><header className="article-header"><span className="eyebrow">{themeName(p.theme)} · HUB CLOUD JOURNAL</span><h1 title={p.title}>{p.title}</h1><p className="article-description">{p.description}</p><div className="article-meta"><span>허브클라우드 에디터</span><time dateTime={p.published||p.created}>{new Date(p.published||p.created).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time><span>{a.sections.length}장의 사진</span></div></header><figure className="article-cover"><img src={'/api/hub/'+encodeURIComponent(first.imageId)} alt={first.caption}/><figcaption>{first.caption}</figcaption></figure><div className="article-body"><p className="article-lead">{a.intro}</p><aside className="article-toc"><strong>이 글에서 읽을 이야기</strong>{a.sections.map((s,i)=><a key={i} href={'#section-'+i}><span>{String(i+1).padStart(2,'0')}</span>{s.heading}</a>)}</aside>{a.sections.map((s,i)=><section id={'section-'+i} key={i} className="article-section"><span className="section-number">{String(i+1).padStart(2,'0')}</span><h2>{s.heading}</h2>{s.paragraphs.map((v,j)=><p key={j}>{v}</p>)}{i>0&&<figure><img src={'/api/hub/'+encodeURIComponent(s.imageId)} alt={s.caption} loading="lazy"/><figcaption>{s.caption}</figcaption></figure>}</section>)}<aside className="article-summary"><span className="eyebrow">TAKEAWAY</span><h2>이야기를 마치며</h2><p>{a.summary}</p></aside><div className="tags">{a.tags.map(t=><span key={t}>#{t}</span>)}</div><div className="article-update">최근 수정 <time dateTime={p.updated}>{new Date(p.updated).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'})}</time></div></div></div><aside className="article-premium-sidebar" aria-label="광고 및 기사 목차">
  <div className="article-premium-sidebar-inner">
    <section className="article-premium-promo" aria-label="샘플 광고">
      <span className="article-premium-ad-label">광고 · 샘플</span>
      <div className="article-premium-promo-art" aria-hidden="true">
        <span>H</span><span className="premium-promo-orbit">✦</span>
        <div><i/><i/><i/></div>
      </div>
      <span className="article-premium-promo-eyebrow">HUB CLOUD STUDIO</span>
      <h2>사진 한 장으로<br/>새로운 이야기를.</h2>
      <p>여행부터 라이프스타일까지, 이미지와 AI로 나만의 전문 웹진을 완성해 보세요.</p>
      <a href="/studio" className="article-premium-promo-cta">콘텐츠 제작하기 <span aria-hidden="true">↗</span></a>
      <small>내부 홍보용 샘플 · 외부 광고는 연결되지 않았습니다.</small>
    </section>
    <nav className="article-premium-index" aria-label="기사 목차 바로가기">
      <span className="article-premium-index-kicker">IN THIS ARTICLE</span>
      <h2>이 글의 목차</h2>
      {a.sections.map((section,index)=><a href={'#section-'+index} key={index}><span>{String(index+1).padStart(2,'0')}</span><span>{section.heading}</span></a>)}
    </nav>
    <a className="article-premium-more" href="/blog">다른 이야기 둘러보기 <span aria-hidden="true">→</span></a>
  </div>
</aside></div>{related.length>0&&<section className="related"><div className="section-heading"><h2>함께 읽으면 좋은 이야기</h2><a href={'/blog?theme='+p.theme}>전체 보기</a></div><div className="post-grid">{related.map(x=><PostCard key={x.id} post={x}/>)}</div></section>}</main>;
}
