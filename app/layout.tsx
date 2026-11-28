import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://askjev.kuhung.me'),
  title: '问问Jev (Ask Jev) - 专治纠结的生活微决策老管家',
  description: '面向中国大陆年轻人的复古新野蛮主义微决策神器。专治买不买、花不花、用不用、中午吃什么、去不去。',
  keywords: ['决策', '选择困难症', 'Ask Jev', '微决策', '买不买', '中午吃什么'],
  alternates: {
    canonical: 'https://askjev.kuhung.me/',
    types: {
      'text/plain': '/llms.txt',
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://askjev.kuhung.me/',
    title: '问问Jev (Ask Jev) - 专治纠结的生活微决策老管家',
    description: '面向中国大陆年轻人的复古新野蛮主义微决策神器。专治买不买、花不花、用不用、中午吃什么、去不去。',
    locale: 'zh_CN',
  },
  verification: {
    other: {
      'msvalidate.01': 'D5EBE19EAD6DFA3CA620B6DBE55405CC',
    },
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '问问Jev (Ask Jev)',
  url: 'https://askjev.kuhung.me/',
  description: '专治日常纠结的生活微决策工具，输入买不买、去不去或中午吃什么，直接给出干脆裁决。',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Web Browser',
  inLanguage: 'zh-CN',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CNY',
  },
  author: {
    '@type': 'Person',
    name: 'kuhung',
    url: 'https://kuhung.me',
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
