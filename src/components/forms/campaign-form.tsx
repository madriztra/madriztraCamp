"use client";

import { useActionState } from "react";

import { launchCampaignAction, type CampaignActionState } from "@/actions/campaigns";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type SongOption = {
  id: string;
  title: string;
  artist: string;
};

const initialState: CampaignActionState = { ok: false, message: "" };

export function LaunchCampaignForm({ songs }: { songs: SongOption[] }) {
  const [state, formAction] = useActionState(launchCampaignAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Launch Campaign</CardTitle>
        <CardDescription>Generate campaign strategy, 30+ content ideas, and a posting schedule.</CardDescription>
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
            <Label htmlFor="duration">Duration</Label>
            <Select id="duration" name="duration" defaultValue="14">
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customDays">Custom days</Label>
            <Input id="customDays" name="customDays" type="number" min={1} max={90} placeholder="21" />
          </div>
          <div className="flex flex-col gap-3 md:col-span-3">
            <SubmitButton disabled={songs.length === 0}>Generate and schedule</SubmitButton>
            <FormMessage ok={state.ok} message={state.message} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
