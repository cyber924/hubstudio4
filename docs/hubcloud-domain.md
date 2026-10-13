# 허브클라우드 도메인 전환

브랜드: 허브클라우드 / HUB CLOUD. Firebase 데이터·인증·콘텐츠 ID는 유지합니다.

2026-10-13 기준 hubcloud.co.kr은 hubstudio4 프로젝트 Production에 등록되었습니다. Vercel 상태는 Invalid Configuration이며 가비아 DNS 적용이 필요합니다.

1. 가비아 DNS: A 레코드, 호스트 @, 값 216.198.79.1. 이 값은 해당 프로젝트의 Vercel DNS 안내에서 확인했습니다. 기존 충돌 A/AAAA 레코드가 있으면 함께 확인합니다. MX 등 메일 설정은 변경하지 않습니다.
2. Vercel Domains에서 Valid Configuration과 HTTPS 접속을 확인합니다.
3. Production 환경변수 SITE_URL=https://hubcloud.co.kr 설정 후 재배포합니다.
4. canonical, og:url, JSON-LD, sitemap.xml, robots.txt는 공통 ORIGIN으로 새 도메인을 사용합니다. 기존 hubstudio4.vercel.app의 모든 경로는 동일 경로의 새 도메인으로 308 이동합니다.
5. 공개 목록 HTML·상세 본문·사이트맵 동기화·실제 404를 새 도메인에서도 검사합니다. Search Console은 새 도메인과 새 사이트맵을 등록합니다.

DNS 연결 전에는 현재 접속 가능한 hubstudio4.vercel.app을 대표 주소로 유지하며, preview 주소를 canonical에 사용하지 않습니다. 도메인 등록만으로 Firebase 환경설정이나 게시글 DB를 교체하지 않습니다.
