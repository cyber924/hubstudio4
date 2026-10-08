import {catalog} from '@/lib/hub';
export async function GET(){try{const images=await catalog();return Response.json({images:images.map(({data,...x})=>x),total:images.length},{headers:{'Cache-Control':'no-store'}});}catch(e){return Response.json({error:(e as Error).message},{status:503});}}
