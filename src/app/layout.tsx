import type { Metadata, Viewport } from "next";

import { SessionProvider } from "@/components/providers/session-provider";
import { getCurrentSession } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Music Growth OS",
    template: "%s | Music Growth OS"
  },
  description: "All-in-one music marketing automation for independent artists and labels.",
  metadataBase: new URL(process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000")
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  colorScheme: "dark"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  return (
    <html lang="en" className="dark">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
