"use client";

import { useActionState } from "react";

import { createSmartLinkAction, type SmartLinkActionState } from "@/actions/smart-links";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const initialState: SmartLinkActionState = { ok: false, message: "" };

export function SmartLinkForm({ songs }: { songs: Array<{ id: string; title: string; artist: string }> }) {
  const [state, formAction] = useActionState(createSmartLinkAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create smart link</CardTitle>
        <CardDescription>Build a public listen page with tracked platform redirects.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="songId">Song</Label>
            <Select id="songId" name="songId" required>
              <option value="">Select a song</option>
              {songs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} - {song.artist}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="think-about-it" />
          </div>
          <div className="flex flex-col gap-3 md:col-span-3">
            <SubmitButton disabled={songs.length === 0}>Create link</SubmitButton>
            <FormMessage ok={state.ok} message={state.message} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
