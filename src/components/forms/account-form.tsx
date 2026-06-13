"use client";

import { useActionState } from "react";
import { ShieldCheck } from "lucide-react";

import { saveConnectedAccount, type AccountActionState } from "@/actions/accounts";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: AccountActionState = { ok: false, message: "" };

export function AccountForm() {
  const [state, formAction] = useActionState(saveConnectedAccount, initialState);
  const providerHelp = [
    "Instagram: gunakan Instagram Business Account ID dan Meta Graph API access token dengan izin instagram_content_publish.",
    "TikTok: gunakan open_id sebagai Account ID dan access token dari TikTok Content Posting API.",
    "YouTube Shorts: gunakan channel ID dan OAuth access token dengan scope youtube.upload."
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect account</CardTitle>
        <CardDescription>Store provider credentials encrypted for metadata and analytics sync.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-5 rounded-md border border-primary/20 bg-primary/10 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Live social publishing requires official OAuth tokens.</p>
              {providerHelp.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </div>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select id="provider" name="provider" defaultValue="spotify">
              <option value="spotify">Spotify</option>
              <option value="youtube">YouTube</option>
              <option value="soundcloud">SoundCloud</option>
              <option value="appleMusic">Apple Music</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">Account ID</Label>
            <Input id="accountId" name="accountId" placeholder="Business ID, open_id, channel ID, or provider account ID" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scopes">Scopes</Label>
            <Input id="scopes" name="scopes" placeholder="read, analytics" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access token</Label>
            <Input id="accessToken" name="accessToken" type="password" autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="refreshToken">Refresh token</Label>
            <Input id="refreshToken" name="refreshToken" type="password" autoComplete="off" />
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <SubmitButton>Save account</SubmitButton>
            <FormMessage ok={state.ok} message={state.message} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
