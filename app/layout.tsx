import type { Metadata } from "next";
import "./globals.css";
import {Header} from '@/components/header';
import {ORIGIN} from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(ORIGIN),
  title: {default:'허브클라우드 | 취향을 담는 전문 블로그',template:'%s | 허브클라우드'},
  description: '이미지에서 시작하는 여행, 맛집, 생활과 취향의 이야기. 허브클라우드의 공개 웹진을 만나보세요.',
  openGraph: {type:'website',siteName:'허브클라우드',title:'허브클라우드 | 취향을 담는 전문 블로그',description:'이미지에서 시작하는 여행, 맛집, 생활과 취향의 이야기.'},
  twitter: {card:'summary',title:'허브클라우드 | 취향을 담는 전문 블로그',description:'이미지에서 시작하는 여행, 맛집, 생활과 취향의 이야기.'},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body><Header/>{children}<footer className="footer"><a className="wordmark" href="/">HUB <b>CLOUD</b></a><span>좋은 이미지에서 시작하는, 더 좋은 이야기.</span><small>© {new Date().getFullYear()} Hub Cloud</small></footer></body>
    </html>
  );
}
