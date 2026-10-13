import type {NextConfig} from 'next';
const config:NextConfig={
  poweredByHeader:false,
  async redirects(){
    // Enable domain migration only after hubcloud.co.kr serves the production site.
    if(process.env.SITE_URL?.replace(/\/$/,'')!=='https://hubcloud.co.kr')return [];
    return [{source:'/:path*',has:[{type:'host' as const,value:'hubstudio4.vercel.app'}],destination:'https://hubcloud.co.kr/:path*',permanent:true}];
  },
};
export default config;
