export const ORIGIN=(process.env.SITE_URL||('https://'+(process.env.VERCEL_PROJECT_PRODUCTION_URL||process.env.VERCEL_URL||'hubstudio4.vercel.app'))).replace(/\/$/,'');
export const HUB_PROJECT=process.env.FIREBASE_PROJECT_ID||'studio-9240700230-1dd9a';
export const HUB_API='https://firestore.googleapis.com/v1/projects/'+HUB_PROJECT+'/databases/(default)/documents';
export const CONTENT_API=HUB_API;
export const FIREBASE_WEB_API_KEY=process.env.FIREBASE_API_KEY||'AIzaSyDEpFAsf1fI65xXklKYsukAWFYw5bzaHyc';
