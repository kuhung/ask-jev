import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '问问Jev (Ask Jev) - 专治纠结的生活微决策老管家',
  description: '面向中国大陆年轻人的复古新野蛮主义微决策神器。专治买不买、花不花、用不用、中午吃什么、去不去。',
  keywords: ['决策', '选择困难症', 'Ask Jev', '微决策', '买不买', '中午吃什么'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FAF8D4',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#FAF8D4] text-black selection:bg-red-200 selection:text-red-900 pb-12">
        {children}
      </body>
    </html>
  );
}
