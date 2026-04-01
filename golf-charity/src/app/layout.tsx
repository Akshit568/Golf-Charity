// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fairway & Good — Golf with Purpose',
  description:
    'Subscribe. Score. Win. Give. The golf platform that makes every round count for something bigger.',
  openGraph: {
    title: 'Fairway & Good',
    description: 'The charity golf subscription platform.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-brand-dark text-brand-cream antialiased">
        {children}
      </body>
    </html>
  );
}
