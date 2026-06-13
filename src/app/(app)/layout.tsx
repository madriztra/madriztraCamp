import { redirect } from "next/navigation";

import { MobileNav } from "@/components/app/mobile-nav";
import { RuntimeModeBanner } from "@/components/app/runtime-mode-banner";
import { Sidebar } from "@/components/app/sidebar";
import { SignOutButton } from "@/components/app/sign-out-button";
import { getCurrentSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-border bg-background/88 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-sm font-medium">{session.user.name ?? "Artist"}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              <SignOutButton />
            </div>
          </header>
          <main className="px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
            <RuntimeModeBanner />
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
