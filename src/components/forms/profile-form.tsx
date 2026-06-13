"use client";

import { useActionState } from "react";

import { updateProfile, type ActionState } from "@/actions/auth";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionState = { ok: false, message: "" };

type Profile = {
  name: string;
  artistName?: string;
  labelName?: string;
  primaryGenre?: string;
  timezone?: string;
  website?: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Keep artist and label context fresh for AI campaign generation.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={profile.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="artistName">Artist name</Label>
            <Input id="artistName" name="artistName" defaultValue={profile.artistName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="labelName">Label name</Label>
            <Input id="labelName" name="labelName" defaultValue={profile.labelName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryGenre">Primary genre</Label>
            <Input id="primaryGenre" name="primaryGenre" defaultValue={profile.primaryGenre} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" defaultValue={profile.timezone ?? "UTC"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input id="website" name="website" type="url" defaultValue={profile.website} />
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <SubmitButton>Save profile</SubmitButton>
            <FormMessage ok={state.ok} message={state.message} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
