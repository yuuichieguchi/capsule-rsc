import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CapsuleRSC Next.js Demo',
  description: 'Demonstrating @capsulersc with Next.js App Router',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
