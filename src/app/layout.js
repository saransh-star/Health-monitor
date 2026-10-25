import './globals.css';
import BottomNav from './components/BottomNav';
import DesktopSidebar from './components/DesktopSidebar';
import MobileTopBar from './components/MobileTopBar';
import { ThemeProvider } from './components/ThemeProvider';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#F4F7FB' },
        { media: '(prefers-color-scheme: dark)', color: '#0B1020' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover',
};

export const metadata = {
    title: 'NutriSnap — Intelligent AI Nutrition & Health Companion',
    description: 'Transform your health with intelligent nutrition tracking, multimodal AI meal recognition, and personalized daily wellness coaching.',
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
            <html lang="en" suppressHydrationWarning data-theme="ai-nebula" className="dark">
                <head>
                    <meta name="apple-mobile-web-app-capable" content="yes" />
                    <link rel="apple-touch-icon" href="/icons/apple_icon.png" />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                try {
                                    const saved = localStorage.getItem('nutrisnap-theme') || 'ai-nebula';
                                    let effective = saved;
                                    if (saved === 'system') {
                                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                                        effective = prefersDark ? 'ai-nebula' : 'clinical-light';
                                    }
                                    const root = document.documentElement;
                                    root.setAttribute('data-theme', effective);
                                    const isLight = effective === 'clinical-light' || effective === 'warm-minimal';
                                    if (isLight) {
                                        root.classList.remove('dark');
                                        root.classList.add('light');
                                        root.style.colorScheme = 'light';
                                    } else {
                                        root.classList.add('dark');
                                        root.classList.remove('light');
                                        root.style.colorScheme = 'dark';
                                    }
                                } catch (e) {}
                            `,
                        }}
                    />
                </head>
                <body className={`${inter.variable} font-sans min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] antialiased transition-colors duration-200`}>
                    <ThemeProvider>
                        <div className="flex min-h-screen">
                            <DesktopSidebar />
                            <div className="flex-1 flex flex-col min-w-0">
                                <MobileTopBar />
                                <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 md:pt-8 pb-24 md:pb-12">
                                    {children}
                                </main>
                            </div>
                        </div>
                        <BottomNav />
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}
