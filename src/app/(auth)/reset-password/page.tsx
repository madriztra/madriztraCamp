import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/forms/auth-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reset Password"
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reset link missing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Request a new password reset link from{" "}
          <Link href="/forgot-password" className="text-foreground hover:text-primary">
            forgot password
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
