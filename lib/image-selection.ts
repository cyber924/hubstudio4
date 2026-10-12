import type {ImageAsset} from './types';

export function validateImageSelection(value:unknown,images:ImageAsset[],count:number):string[]{
 if(!Array.isArray(value)||value.length!==count||!value.every(id=>typeof id==='string'))
  throw new Error('이미지를 '+count+'개 선택해 주세요. 이미지허브에서 직접 선택한 뒤 다시 시도할 수 있습니다.');
 const ids=value as string[];
 const available=new Set(images.map(image=>image.id));
 if(new Set(ids).size!==count||ids.some(id=>!available.has(id)))
  throw new Error('중복되거나 사용할 수 없는 이미지가 선택되었습니다. 공개 이미지를 다시 선택해 주세요.');
 return ids;
}
