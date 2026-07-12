import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/features/shared/components/QueryProvider";
import AuthSessionProvider from "@/features/shared/components/AuthSessionProvider";
import StyledComponentsRegistry from "@/lib/styled-components-registry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mind Profilert",
  description: "정신건강을 기록하는 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StyledComponentsRegistry>
          <AuthSessionProvider>
            <QueryProvider>{children}</QueryProvider>
          </AuthSessionProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
