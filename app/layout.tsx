import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { ClientSessionProvider } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "SkillSpring Launchpad",
  description: "AI-Powered Growth for Everyone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientSessionProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClientSessionProvider>
      </body>
    </html>
  );
}