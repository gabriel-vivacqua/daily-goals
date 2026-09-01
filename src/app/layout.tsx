import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import Nav from "@/components/Nav";
import SponsoredBanner from "@/components/SponsoredBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daily Goals",
  description: "A shared daily goals tracker with points, streaks, and a household calendar.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {user ? <Nav user={user} /> : null}
        <main className={user ? "mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10" : ""}>
          {children}
          {user ? <SponsoredBanner /> : null}
        </main>
      </body>
    </html>
  );
}
