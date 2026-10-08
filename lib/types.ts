export const THEMES = [
 {id:'travel',name:'여행',subtitle:'떠나고 싶은 다음 목적지',icon:'✈'},
 {id:'food',name:'맛집·카페',subtitle:'맛있는 일상의 발견',icon:'☕'},
 {id:'life',name:'생활정보',subtitle:'매일을 더 편리하게',icon:'⌂'},
 {id:'product',name:'제품·라이프스타일',subtitle:'좋은 물건과 취향',icon:'◇'},
 {id:'golf',name:'파크골프',subtitle:'필드에서 즐기는 새로운 일상',icon:'⚑'},
] as const;
export type Article = {title:string;description:string;intro:string;sections:{heading:string;paragraphs:string[];imageId:string;caption:string}[];summary:string;tags:string[]};
export type ImageAsset = {id:string;title:string;tags:string[];prompt:string;ratio:string;url:string;data?:string};
export type Post = {id:number;owner:string;theme:string;title:string;description:string;content:string;status:string;created:string;updated:string;published:string|null;review:string|null;version:number};
export type Review = {score:number;findings:{severity:'high'|'medium'|'low';section:number;message:string;suggestion:string}[];revised:Article;visualChecked:boolean};
export const themeName=(id:string)=>THEMES.find(t=>t.id===id)?.name||id;
