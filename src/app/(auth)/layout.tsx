import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
        <Link href="/" className="mb-8 text-center text-lg font-semibold">
          Music Growth OS
        </Link>
        {children}
      </div>
    </main>
  );
}
