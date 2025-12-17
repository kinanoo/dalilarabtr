import type { Metadata } from "next";
import "./globals.css";
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import { ThemeProviderWrapper } from "@/components/ThemeProvider";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import WhatsAppAssistant from "@/components/WhatsAppAssistant";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "دليل العرب والاجانب في تركيا | 2026",
  description: "الدليل الشامل للعرب والأجانب للإقامة، الفيزا، والعمل في تركيا.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <GoogleAnalytics />
      </head>
      <body className={`font-cairo bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50 min-h-screen flex flex-col transition-colors`}>
        <ThemeProviderWrapper>
          <div className="pb-20 lg:pb-0">
            {children}
          </div>
          <MobileNav />
          <WhatsAppAssistant />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}