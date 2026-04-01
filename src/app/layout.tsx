import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '기틀 (基틀) - Data-driven B2B Media',
  description: '스타트업 엑시트와 B2B 시장 데이터를 분석하는 프리미엄 미디어',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="antialiased min-h-screen flex flex-col bg-ivory text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
