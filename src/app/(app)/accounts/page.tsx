import type { Metadata } from "next";

import { PageHeader } from "@/components/app/page-header";
import { AccountForm } from "@/components/forms/account-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { formatDateTime } from "@/lib/utils";
import { ConnectedAccount } from "@/models/ConnectedAccount";

export const metadata: Metadata = {
  title: "Accounts"
};

export default async function AccountsPage() {
  const session = await requireSession();
  await connectToDatabase();
  const accounts = await ConnectedAccount.find({ userId: session.user.id })
    .select("+accessTokenEncrypted")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <PageHeader title="Accounts" description="Manage connected provider accounts used for metadata and analytics sync." />
      <AccountForm />
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account._id.toString()}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{account.displayName}</CardTitle>
                <Badge variant={account.syncStatus === "healthy" ? "success" : "warning"}>{account.syncStatus}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Provider: {account.provider}</p>
              <p>Account ID: {account.accountId}</p>
              <p>
                Live publishing:{" "}
                <span className={account.accessTokenEncrypted ? "text-emerald-300" : "text-amber-300"}>
                  {account.accessTokenEncrypted ? "ready" : "token required"}
                </span>
              </p>
              <p>Saved: {formatDateTime(account.createdAt)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
