import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { currentDay, latestEntry } from "@/data/changelog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = `A tiny daily planner that gets better every day — one improvement shipped by AI, every single day. Currently on Day ${currentDay()}: ${latestEntry().title}.`;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Better Every Day",
    template: "%s — Better Every Day",
  },
  description,
  openGraph: {
    title: "Better Every Day",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

// Runs before first paint so the chosen theme is applied with no flash of the
// wrong colors. Reads the saved preference and falls back to the OS setting.
const themeScript = `
(function () {
  try {
    var pref = localStorage.getItem('bed-theme');
    var dark = pref === 'dark' || ((!pref || pref === 'system') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
