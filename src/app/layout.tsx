import type { Metadata } from "next";
import { JetBrains_Mono, Geist } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jobtrack.arkapravo.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JobTrack — Track your job hunt without the clutter",
    template: "%s — JobTrack",
  },
  description:
    "Keep tabs on applied roles, interview rounds, offers, and rejections. Fast table search, multi-filter controls, and visual analytics.",
  applicationName: "JobTrack",
  authors: [{ name: "Arkapravo Ghosh" }],
  creator: "Arkapravo Ghosh",
  publisher: "Arkapravo Ghosh",
  keywords: [
    "JobTrack",
    "job application tracker",
    "job tracker",
    "interview tracker",
    "interview rounds tracker",
    "job search manager",
    "career tracker",
    "job hunt analytics",
    "application funnel",
  ],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "JobTrack",
    title: "JobTrack — Track your job hunt without the clutter",
    description:
      "Keep tabs on applied roles, interview rounds, offers, and rejections. Fast table search, multi-filter controls, and visual analytics.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 3584,
        height: 1880,
        alt: "JobTrack — Modern Job Application Tracker & Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobTrack — Track your job hunt without the clutter",
    description:
      "Keep tabs on applied roles, interview rounds, offers, and rejections. Fast table search, multi-filter controls, and visual analytics.",
    images: ["/opengraph-image.png"],
    creator: "@arkapravoghosh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", jetbrainsMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans tracking-[-0.01em]">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar user={session} />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground bg-background/50">
            © {new Date().getFullYear()} Arkapravo Ghosh. All rights reserved.
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
