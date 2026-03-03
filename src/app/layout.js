import './globals.css';
import BottomNav from './components/BottomNav';
import DesktopSidebar from './components/DesktopSidebar';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
    themeColor: '#0f172a',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export const metadata = {
    title: 'NutriSnap — AI Food Tracker',
    description: 'Snap your food, track your nutrition, and lose weight with AI-powered analysis',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'NutriSnap',
    },
};

export default function RootLayout({ children }) {
    return (
        <ClerkProvider>
            <html lang="en">
                <head>
                    <meta name="apple-mobile-web-app-capable" content="yes" />
                    <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
                </head>
                <body className={`${inter.className} bg-dark-950 text-dark-100 min-h-screen md:flex`}>
                    <DesktopSidebar />
                    <main className="flex-1 w-full max-w-lg md:max-w-4xl mx-auto px-4 pt-2 md:pt-10 pb-20 md:pb-12 h-full">
                        {children}
                    </main>
                    <BottomNav />
                </body>
            </html>
        </ClerkProvider>
    );
}
